
# Streaming OpenAI in Elixir Phoenix

Date

Sunday, January 7, 2024

At  [Axflow](https://axflow.dev/), we are building  [open source tooling](https://github.com/axflow/axflow)  to help developers integrate large language models into their products. The majority of this tooling thus far has been written in TypeScript, though we’ve been exploring replacing part of our stack with a Phoenix application. We spend quite a bit of time working with OpenAI and given LLMs are all the rage, I wanted to write about how we’re integrating with it in our Phoenix application.

This post is the first in a series of posts about integrating with OpenAI’s chat completions endpoint.

1.  Part I (this post) implements a module for streaming chat completions and a Phoenix API endpoint to stream the completions to clients.
2.  [Part II](https://benreinhart.com/blog/openai-streaming-elixir-phoenix-part-2)  goes deeper on stream parsing and introduces state for more robust handling of HTTP streams.
3.  [Part III](https://benreinhart.com/blog/openai-streaming-elixir-phoenix-part-3)  uses Phoenix LiveView to stream completions to users connected to your site.

## Environment

If you follow along you’ll need a Phoenix application and an OpenAI API key. If you don’t already have a Phoenix application, you can follow the  [up and running](https://hexdocs.pm/phoenix/up_and_running.html)  guide.

## Calling OpenAI without streaming

To start simple and work our way up, let’s first write code to call OpenAI’s chat completion endpoint  _without_  streaming the response.

Let’s add  [Req](https://github.com/wojtekmach/req)  to the list of dependencies as we’ll need an HTTP client.

```
{:req, "~> 0.4.0"}
```

Next, create a module named  `MyApp.Openai`  at  `lib/my_app/openai.ex`. The initial requirements are:

1.  Be able to perform HTTP requests to OpenAI
2.  Ensure our HTTP requests are properly authenticated by their API
3.  Parse the JSON response into Elixir objects

Req will automatically parse (non-streaming) JSON responses, leaving us to implement only the first two.

```
defmodule MyApp.Openai do
  @chat_completions_url "https://api.openai.com/v1/chat/completions"

  def chat_completion(request) do
    Req.post(@chat_completions_url, json: request)
  end
end
```

This code will call OpenAI’s chat completion endpoint, but without authentication the request will fail.

OpenAI expects your API key in the  `Authorization`  header to  [authenticate to their API](https://platform.openai.com/docs/api-reference/authentication). Before adding the API key to the request, the app must be configured with the key. In my case, I read the key from an environment variable in  `config/runtime.exs`.

```
config :my_app, :openai, api_key: System.get_env("OPENAI_API_KEY")
```

Now we need to tell Req to add this key to the request. Req even has some sugar for the  `Authorization`  header.

```
defmodule MyApp.Openai do
  @chat_completions_url "https://api.openai.com/v1/chat/completions"

  def chat_completion(request) do
    Req.post(@chat_completions_url,
      json: request,
      auth: {:bearer, api_key()}
    )
  end

  defp api_key() do
    Application.get_env(:my_app, :openai)[:api_key]
  end
end
```

We can open up a shell with  `iex -S mix`  to try it out:

```
iex> {:ok, %{body: response}} = MyApp.Openai.chat_completion(%{ model: "gpt-3.5-turbo", messages: [%{role: "user", content: "Hello 3.5!"}] })
iex> response
%{
  "choices" => [
    %{
      "finish_reason" => "stop",
      "index" => 0,
      "message" => %{
        "content" => "Hello! How can I assist you today?",
        "role" => "assistant"
      }
    }
  ],
  # ...
  }
}
```

## Streaming the response

OpenAI’s API supports streaming responses. To stream the response, we need to set  [`stream`  to  `true`  in the request body](https://platform.openai.com/docs/api-reference/chat/create#chat-create-stream).

We can  [handle streams in Req a few ways](https://github.com/wojtekmach/req/blob/6549765523d29b81170a0a610ca0ec7b2345ac98/lib/req/request.ex#L74-L88), but here we’ll use the callback function. Let’s add another clause for the  `chat_completion`  function that takes two arguments.  `chat_completion/2`  will be defined as:

```
def chat_completion(request, callback) do
  Req.post(@chat_completions_url,
    json: request,
    auth: {:bearer, api_key()},
    into: fn {:data, data}, context ->
      callback.(data)
      {:cont, context}
    end
  )
end
```

If we run this, setting  `stream`  to  `true`  in the request, we’ll see the response data as raw server sent events.

```
MyApp.Openai.chat_completion(
  %{
    model: "gpt-3.5-turbo",
    stream: true,
    messages: [%{role: "user", content: "Hello 3.5!"}]
  },
  &IO.puts/1
)
```

Notice that the format for each event is  `data: <json-encoded data>\n\n`, except the last which is always  `data: [DONE]\n\n`. For example:

```
data: {"id":"chatcmpl-8UmwRPfWQVApzdIPgAtpcF3RnpeEr","object":"chat.completion.chunk","created":1702348663,"model":"gpt-3.5-turbo-0613","system_fingerprint":null,"choices":[{"index":0,"delta":{"role":"assistant","content":""},"finish_reason":null}]}


```

**Note that some chunks in the streamed response contain multiple of these events, while others may only have one**. We must keep this in mind when parsing.

### Parsing the events into Elixir data structures

When we stream the response, we need to handle parsing the data ourselves. Thanks to Elixir, we don’t have to differentiate between raw bytes and language-level strings. We can also rest assured that Elixir will properly handle unicode, encodings, graphemes, etc. Parsing these events is therefore a simple string parsing exercise.

Given the following streaming input

```
data: {"json":"object"}

data: {"json":"object 2"}

data: {"json":"object N"}

data: [DONE]


```

1.  Strip  `data:` from the chunk
2.  Remove the trailing newlines
3.  Extract and parse the JSON object

This is trivial to express in Elixir:

```
defp parse(chunk) do
  chunk
  |> String.split("data: ")
  |> Enum.map(&String.trim/1)
  |> Enum.map(&decode/1)
  |> Enum.reject(&is_nil/1)
end

defp decode(""), do: nil
defp decode("[DONE]"), do: nil
defp decode(data), do: Jason.decode!(data)
```

The  `decode/1`  function will receive some empty strings as a result of the string splitting, so we must ignore those. It must also ignore the final  `[DONE]`  event. Otherwise, we return the decoded JSON. Once  `parse/1`  rejects the  `nil`  values, we’re left with only the decoded JSON.

Lastly, we need to update  `chat_completions/2`  to make use of  `parse/1`. Remove the line that invokes the callback and replace it with the following:

```
 def chat_completion(request, callback) do
   Req.post(@chat_completions_url,
     json: set_stream(request, true),
     auth: {:bearer, api_key()},
     into: fn {:data, data}, acc ->
-      callback.(data)
+      Enum.each(parse(data), callback)
       {:cont, acc}
     end
   )
 end
```

If we run our  `chat_completion/2`  function with a callback that prints its argument, we’ll see each chunk of the stream as an Elixir map!

### Improving the interface

Before moving on, one thing we should do to make our code robust is to ensure its used correctly. We implemented two functions,  `chat_completion/1`  and  `chat_completion/2`, the first does not support streaming while the second expects it. Rather than ask callers to remember this, let’s remove the  `stream`  property from being a responsibility of the caller. We can add a function to ensure the request body’s  `stream`  property is set to the expected value in all cases.

```
  def chat_completion(request) do
    Req.post(@chat_completions_url,
-     json: request,
+     json: set_stream(request, false),
      auth: {:bearer, api_key()}
    )
  end

  def chat_completion(request, callback) do
    Req.post(@chat_completions_url,
-     json: request,
+     json: set_stream(request, true),
      auth: {:bearer, api_key()},
      into: fn {:data, data}, acc ->
        Enum.each(parse(data), callback)
        {:cont, acc}
      end
    )
  end

+ defp set_stream(request, value) do
+   request
+   |> Map.drop([:stream, "stream"])
+   |> Map.put(:stream, value)
+ end
```

With that, our module to handle both streaming and non-streaming calls to OpenAI’s chat completion endpoint is complete! Below is the final code:

```
defmodule MyApp.Openai do
  @chat_completions_url "https://api.openai.com/v1/chat/completions"

  def chat_completion(request) do
    Req.post(@chat_completions_url,
      json: set_stream(request, false),
      auth: {:bearer, api_key()}
    )
  end

  def chat_completion(request, callback) do
    Req.post(@chat_completions_url,
      json: set_stream(request, true),
      auth: {:bearer, api_key()},
      into: fn {:data, data}, acc ->
        Enum.each(parse(data), callback)
        {:cont, acc}
      end
    )
  end

  defp set_stream(request, value) do
    request
    |> Map.drop([:stream, "stream"])
    |> Map.put(:stream, value)
  end

  defp parse(chunk) do
    chunk
    |> String.split("data: ")
    |> Enum.map(&String.trim/1)
    |> Enum.map(&decode/1)
    |> Enum.reject(&is_nil/1)
  end

  defp decode(""), do: nil
  defp decode("[DONE]"), do: nil
  defp decode(data), do: Jason.decode!(data)

  defp api_key() do
    Application.get_env(:my_app, :openai)[:api_key]
  end
end
```

## Streaming from Phoenix

As a last step, we’ll setup an API to stream these events to clients. We can use this as an exercise to map over the OpenAI stream, returning our own stream. We’ll return  [newline-delimited json](https://ndjson.org/)  from our API. The POST request body for this endpoint is expected to have a single key named  `request`  that contains any values supported by  [OpenAI’s chat completion request](https://platform.openai.com/docs/api-reference/chat/create).

Create  `lib/my_app_web/controllers/chat_controller.ex`  and add the following code.

```
defmodule MyAppWeb.ChatController do
  use MyAppWeb, :controller

  @nd_json_content_type "application/x-ndjson"

  def stream(conn, %{"request" => request}) do
    conn =
      conn
      |> put_resp_content_type(@nd_json_content_type)
      |> send_chunked(200)

    MyApp.Openai.chat_completion(request, fn data ->
      result = Jason.encode!(data)
      chunk(conn, result)
      chunk(conn, "\n")
    end)

    conn
  end
end
```

_Note: Any request input validation is an exercise for the reader._

The last thing we need to do is add a route to our routes file to expose this endpoint.

```
pipeline :api do
  plug :accepts, ["json"]
end

scope "/api", MyAppWeb do
  pipe_through [:api]

  post "/chat", ChatController, :stream
end
```

Boom! We can now stream OpenAI chat completion responses through our Phoenix application using a response format that is dead simple for clients to parse.

```
curl -i 'http://localhost:4000/api/chat' -H "content-type: application/json" --data-raw '{"request":{"model":"gpt-3.5-turbo","temperature":1,"messages":[{"role":"user","content":"Hello 3.5!"}]}}'
HTTP/1.1 200 OK
content-type: application/x-ndjson; charset=utf-8
transfer-encoding: chunked

{"choices":[{"delta":{"content":"","role":"assistant"},"finish_reason":null,"index":0,"logprobs":null}],"created":1704667517,"id":"chatcmpl-8eWBJyuPK2Hyq5COCNbfR02BuYoUj","model":"gpt-3.5-turbo-0613","object":"chat.completion.chunk","system_fingerprint":null}
{"choices":[{"delta":{"content":"Hello"},"finish_reason":null,"index":0,"logprobs":null}],"created":1704667517,"id":"chatcmpl-8eWBJyuPK2Hyq5COCNbfR02BuYoUj","model":"gpt-3.5-turbo-0613","object":"chat.completion.chunk","system_fingerprint":null}
{"choices":[{"delta":{"content":"!"},"finish_reason":null,"index":0,"logprobs":null}],"created":1704667517,"id":"chatcmpl-8eWBJyuPK2Hyq5COCNbfR02BuYoUj","model":"gpt-3.5-turbo-0613","object":"chat.completion.chunk","system_fingerprint":null}
{"choices":[{"delta":{"content":" How"},"finish_reason":null,"index":0,"logprobs":null}],"created":1704667517,"id":"chatcmpl-8eWBJyuPK2Hyq5COCNbfR02BuYoUj","model":"gpt-3.5-turbo-0613","object":"chat.completion.chunk","system_fingerprint":null}
{"choices":[{"delta":{"content":" can"},"finish_reason":null,"index":0,"logprobs":null}],"created":1704667517,"id":"chatcmpl-8eWBJyuPK2Hyq5COCNbfR02BuYoUj","model":"gpt-3.5-turbo-0613","object":"chat.completion.chunk","system_fingerprint":null}
{"choices":[{"delta":{"content":" I"},"finish_reason":null,"index":0,"logprobs":null}],"created":1704667517,"id":"chatcmpl-8eWBJyuPK2Hyq5COCNbfR02BuYoUj","model":"gpt-3.5-turbo-0613","object":"chat.completion.chunk","system_fingerprint":null}
{"choices":[{"delta":{"content":" assist"},"finish_reason":null,"index":0,"logprobs":null}],"created":1704667517,"id":"chatcmpl-8eWBJyuPK2Hyq5COCNbfR02BuYoUj","model":"gpt-3.5-turbo-0613","object":"chat.completion.chunk","system_fingerprint":null}
{"choices":[{"delta":{"content":" you"},"finish_reason":null,"index":0,"logprobs":null}],"created":1704667517,"id":"chatcmpl-8eWBJyuPK2Hyq5COCNbfR02BuYoUj","model":"gpt-3.5-turbo-0613","object":"chat.completion.chunk","system_fingerprint":null}
{"choices":[{"delta":{"content":" today"},"finish_reason":null,"index":0,"logprobs":null}],"created":1704667517,"id":"chatcmpl-8eWBJyuPK2Hyq5COCNbfR02BuYoUj","model":"gpt-3.5-turbo-0613","object":"chat.completion.chunk","system_fingerprint":null}
{"choices":[{"delta":{"content":"?"},"finish_reason":null,"index":0,"logprobs":null}],"created":1704667517,"id":"chatcmpl-8eWBJyuPK2Hyq5COCNbfR02BuYoUj","model":"gpt-3.5-turbo-0613","object":"chat.completion.chunk","system_fingerprint":null}
{"choices":[{"delta":{},"finish_reason":"stop","index":0,"logprobs":null}],"created":1704667517,"id":"chatcmpl-8eWBJyuPK2Hyq5COCNbfR02BuYoUj","model":"gpt-3.5-turbo-0613","object":"chat.completion.chunk","system_fingerprint":null}
```
# Streaming OpenAI in Elixir Phoenix Part II



1.  In  [part I](https://benreinhart.com/blog/openai-streaming-elixir-phoenix), we implement a module and API endpoint for streaming chat completions.
2.  Part II (this post) revisits stream parsing and why you may want stateful parsing.
3.  [Part III](https://benreinhart.com/blog/openai-streaming-elixir-phoenix-part-3)  uses Phoenix LiveView to stream completions to users connected to your site.

## You may not need this

[The previous post](https://benreinhart.com/blog/openai-streaming-elixir-phoenix)  implements a working integration against OpenAI. In practice I have not encountered the problems this post describes and aims to solve. It may be best to stick with the simpler implementation and leave this as more of an intellectual exercise.

_I did not thoroughly investigate, but I did not see these potential problems addressed in the community-maintained OpenAI Elixir packages either. Please correct me if I’m wrong!_

## Revisiting the parser

In the previous post, we implemented streaming event parsing using the following code:

```
defp parse(chunk) do
  chunk
  |> String.split("data: ")
  |> Enum.map(&String.trim/1)
  |> Enum.map(&decode/1)
  |> Enum.reject(&is_nil/1)
end

defp decode(""), do: nil
defp decode("[DONE]"), do: nil
defp decode(data), do: Jason.decode!(data)
```

The input to  `parse/1`  (the  `chunk`) was assumed to be zero or more  _complete_  events, e.g.:

```
data: {"id":"chatcmpl-8eqSTjwUmipuvL2s8CzjmXd1dTS08","object":"chat.completion.chunk","created":1704745461,"model":"gpt-3.5-turbo-0613","system_fingerprint":null,"choices":[{"index":0,"delta":{"content":"Hello"},"logprobs":null,"finish_reason":null}]}

data: {"id":"chatcmpl-8eqSTjwUmipuvL2s8CzjmXd1dTS08","object":"chat.completion.chunk","created":1704745461,"model":"gpt-3.5-turbo-0613","system_fingerprint":null,"choices":[{"index":0,"delta":{"content":"!"},"logprobs":null,"finish_reason":null}]}


```

However, what if we were to receive a partial event? That is, what if the bytes that comprise one or more of the events in the stream arrive at different times? For example, let’s take the first event from above and say it arrived in stages.

Stage 1:

```
data: {"id":"chatcmpl-8eqSTjwUmipuvL2s8CzjmXd1dTS08","object":"chat.completion.chunk","created":1704745
```

Stage 2:

```
461,"model":"gpt-3.5-turbo-0613","system_fingerprint":null,"choices":[{"index":0,"delta":{"content":"Hello"},"logprobs":null,"finish_reason":null}]}


```

If this were to happen, the parser would fail to extract the events correctly as it currently assumes the entire event is present when invoking  `parse/1`.

## HTTP buffering

Some server environments will  [buffer data and send the data to the client once the buffer reaches a certain size](https://gist.github.com/CMCDragonkai/6bfade6431e9ffb7fe88#buffering-problem). Even when a web app’s server does not do this, it’s possible there is a proxy (or some other middleman) that sits between the source server and the client. If this is the case, it’s possible that a client reading from a stream of events will receive portions of an event at a time and thus be responsible for stringing them back together.

If we want a robust implementation that can withstand this scenario, we’ll need to introduce state into our parser.

_Note: In practice, I frequently work with streaming APIs and have  [implemented zero-dependency clients](https://github.com/axflow/axflow/tree/main/packages/models#supported-models)  against OpenAI, Anthropic, Cohere, Google, and more without ever experiencing this issue._

## Updating our parser

Before introducing state, let’s rework the parser to remove the assumption that an entire event is present at once.

Among the greatest joys of working with Elixir is iterating over binaries (strings) and using pattern matching to extract or otherwise modify the input in some way. Whether or not we need to optimize our parser around the above scenario, reworking it in this way will be a fun exercise!

Let’s reimplement the parser to take a  `buffer`  argument and iterate over the binary using pattern matching and recursion. We’ll add two new functions,  `parse/2`  and  `parse/3`.

```
def parse(buffer, chunk) do
  parse(buffer, chunk, [])
end

defp parse(buffer, chunk, events) do
  # TODO
end
```

`parse/2`  will be the public interface for callers, while  `parse/3`  will implement the parsing logic. The arguments are:

-   `buffer`  — This will hold the intermediate contents of a single event while we iterate over a given  `chunk`. Later, when we introduce state, this buffer will persist between chunks that arrive separately in the stream.
-   `chunk`  — This is a single chunk of data received from the stream of all chunks, which may contain zero or more complete or incomplete events.
-   `events`  — A single  `chunk`  may contain more than one event, so we’ll keep a list of the events we’ve parsed and return them when parsing is complete.

```
defp parse([buffer | "\n"], "\n" <> rest, events) do
  case IO.iodata_to_binary(buffer) do
    "data: [DONE]" ->
      parse([], rest, events)

    "data: " <> event ->
      parse([], rest, [Jason.decode!(event) | events])
  end
end

defp parse(buffer, <<char::utf8, rest::binary>>, events) do
  parse([buffer | <<char::utf8>>], rest, events)
end

defp parse(buffer, "", events) do
  {buffer, Enum.reverse(events)}
end
```

That’s a lot of functionality in only a few lines of code, so let’s unpack it. At a high-level:

-   The first clause matches when we have two consecutive newlines present, which is the event separator. In this case, we either add the (JSON-decoded) event to the list of events and continue or skip it if it signals the end of the stream.
-   The second clause matches when the chunk is non-empty (but is also not the event separator). In this case, we extract the first utf8 character, add it to our buffer, and continue parsing the rest of the chunk.
-   The third clause matches when there are no more bytes left in the chunk to parse. In this case, we return a tuple consisting of the  `buffer`  and the (reversed) list of  `events`. We reverse the events because we prepended them to the list during parsing as to not waste memory due to Elixir’s immutable data structures (adding an item to the head of a list is constant in time and memory).

Pattern matching is used extensively here, not only in the function heads but also in a  `case`  statement. We destructure binaries in multiple places using declarative syntax. Modifiers like  `::utf8`  are used to ensure that we don’t naively destructure a subset of a single character but entire characters at a time (since utf8 is variable-width). For more on this, I recommend the  [Elixir guides](https://hexdocs.pm/elixir/binaries-strings-and-charlists.html)  and  [The Absolute Minimum Every Software Developer Must Know About Unicode in 2023](https://tonsky.me/blog/unicode).

Lastly, we use  [iodata](https://hexdocs.pm/elixir/1.12/IO.html#module-io-data)  as our buffer for efficiency. Naively, we could have used a string as our buffer and appended each utf8 character to it as we went. However, doing so would result in an explosion in memory consumption because each append operation would copy the entire string and create a new one with the new character appended. Instead, we add each character to a nested list with one call at the end to convert it into a string.

### An aside on binary pattern matching

I’ve written many low-level stream parsers in TypeScript using  `TransformStreams`  and  `Uint8Arrays`  and I can confidently say it is SO MUCH MORE enjoyable to do this in Elixir.

> This is one of those simple ideas which after you have seen it makes you wonder how any language could be without it.

—  Joe Armstrong on binary pattern matching and the bit syntax in  [A History of Erlang](https://www.labouseur.com/courses/erlang/history-of-erlang-armstrong.pdf)

## A quick test

To make this concrete and ensure it’s working, let’s add a quick unit test. Create  `test/my_app/openai_test.exs`  and add the following code.

```
defmodule MyApp.OpenaiTest do
  use MyApp.DataCase

  alias MyApp.Openai

  test "can parse complete chunks" do
    event_one = %{
      "choices" => [
        %{
          "delta" => %{"content" => "Hello"},
          "finish_reason" => nil,
          "index" => 0,
          "logprobs" => nil
        }
      ],
      "created" => 1_704_745_461,
      "id" => "chatcmpl-8eqSTjwUmipuvL2s8CzjmXd1dTS08",
      "model" => "gpt-3.5-turbo-0613",
      "object" => "chat.completion.chunk",
      "system_fingerprint" => nil
    }

    event_two = %{
      "choices" => [
        %{"delta" => %{"content" => "!"}, "finish_reason" => nil, "index" => 0, "logprobs" => nil}
      ],
      "created" => 1_704_745_461,
      "id" => "chatcmpl-8eqSTjwUmipuvL2s8CzjmXd1dTS08",
      "model" => "gpt-3.5-turbo-0613",
      "object" => "chat.completion.chunk",
      "system_fingerprint" => nil
    }

    chunk = """
    data: #{Jason.encode!(event_one)}

    data: #{Jason.encode!(event_two)}

    data: [DONE]

    """

    assert {[], [^event_one, ^event_two]} = Openai.parse([], chunk)
  end
end
```

Hopefully this example clarifies the expected inputs and outputs to  `parse/2`.

## Swapping out  `parse/1`

At this point, we can replace the previous parsing logic,  `parse/1`, with  `parse/2`.

```
 def chat_completion(request, callback) do
   Req.post(@chat_completions_url,
     json: set_stream(request, true),
     auth: {:bearer, api_key()},
     into: fn {:data, data}, acc ->
-      Enum.each(parse(data), callback)
+      {_buffer, events} = parse([], data)
+      Enum.each(events, callback)
       {:cont, acc}
     end
   )
 end

- defp parse(chunk) do
-   chunk
-   |> String.split("data: ")
-   |> Enum.map(&String.trim/1)
-   |> Enum.map(&decode/1)
-   |> Enum.reject(&is_nil/1)
- end
-
- defp decode(""), do: nil
- defp decode("[DONE]"), do: nil
- defp decode(data), do: Jason.decode!(data)
```

## Introducing state

It’s time to address the problem we described above: If a streaming chunk arrives containing an incomplete event, our previous parsing logic will fail. Our new parsing logic will also fail as it is currently written, but we can change that by introducing state.

Before we continue, let’s add a test that makes it clear where state is needed.

```
test "can parse incomplete chunks" do
  chunk_one =
    """
    data: {"id":"chatcmpl-8eqSTjwUmipuvL2s8CzjmXd1dTS08","object":"chat.completion.chunk","created":1704745
    """
    |> String.trim()

  chunk_two = """
  461,"model":"gpt-3.5-turbo-0613","system_fingerprint":null,"choices":[{"index":0,"delta":{"content":"Hello"},"logprobs":null,"finish_reason":null}]}

  """

  expected_event = %{
    "choices" => [
      %{
        "delta" => %{"content" => "Hello"},
        "finish_reason" => nil,
        "index" => 0,
        "logprobs" => nil
      }
    ],
    "created" => 1_704_745_461,
    "id" => "chatcmpl-8eqSTjwUmipuvL2s8CzjmXd1dTS08",
    "model" => "gpt-3.5-turbo-0613",
    "object" => "chat.completion.chunk",
    "system_fingerprint" => nil
  }

  assert {buffer, []} = Openai.parse([], chunk_one)
  assert {[], [^expected_event]} = Openai.parse(buffer, chunk_two)
end
```

In this test case, notice how it takes two calls to  `parse/2`  in order to construct a single event, with the  `buffer`  from the first call passed to the second. This is where we’ll need to keep state—between calls to  `parse/2`.

Admittedly, this is where Elixir can feel more difficult than a language like TypeScript, Go, etc. Since Elixir’s data is immutable, we cannot simply update a variable or modify an existing data structure. To solve for this, Elixir—more accurately, the underlying virtual machine—has a notion of processes, and  [processes are stateful](https://hexdocs.pm/elixir/processes.html#state). While this feels like friction at first, processes are really useful in ways beyond state and thus we often gain other benefits when leveraging them (e.g., concurrency, fault tolerance).

Thankfully, we do not have to deal with most of the mechanics of processes because Elixir provides a built-in abstraction around state called  [agents](https://hexdocs.pm/elixir/1.16.0/Agent.html). Let’s update  `chat_completion/2`  to use an agent.

```
def chat_completion(request, callback) do
  # Initialize buffer state
  {:ok, agent} = Agent.start_link(fn -> [] end)

  response =
    Req.post(@chat_completions_url,
      json: set_stream(request, true),
      auth: {:bearer, api_key()},
      into: fn {:data, data}, acc ->
        # Get previous buffer value
        buffer = Agent.get(agent, & &1)

        {buffer, events} = parse(buffer, data)
        Enum.each(events, callback)

        # Update buffer value with the result from calling parse/2
        :ok = Agent.update(agent, fn _ -> buffer end)

        {:cont, acc}
      end
    )

  # Make sure we shut the agent down
  :ok = Agent.stop(agent)

  response
end
```

The agent preserves the buffer between the arrival of different chunks. With that, our parser is now stateful and can handle chunks containing incomplete events.


# Streaming OpenAI in Elixir Phoenix Part III

Date

Sunday, March 3, 2024

This is the final part in a series about streaming OpenAI chat completions in Elixir.

1.  In  [part I](https://benreinhart.com/blog/openai-streaming-elixir-phoenix), we implement a module and API endpoint for streaming chat completions.
2.  [Part II](https://benreinhart.com/blog/openai-streaming-elixir-phoenix-part-2)  revisits stream parsing and why you may want stateful parsing.
3.  Part III (this post) uses Phoenix LiveView to stream completions to users of your site.

### Creating our LiveView

To keep this post reasonable in length, we’re going to focus solely on streaming chat completions to the client using  [LiveView](https://hexdocs.pm/phoenix_live_view/welcome.html). Storing chats in the database, authenticating users, etc. is out of scope.

Since we’re not storing data, we’re not going to use the Phoenix generators to create our LiveView. Instead, we’ll create these ourselves.

Let’s start by creating  `my_app_web/live/chats_live/index.ex`:

```
defmodule MyAppWeb.ChatsLive.Index do
  use MyAppWeb, :live_view

  @impl true
  def mount(_params, _session, socket) do
    {:ok, socket}
  end
end
```

Next, create  `my_app_web/live/chats_live/index.html.heex`  and add the following:

```
<div class="h-full w-full max-w-3xl flex flex-col mx-auto bg-gray-50 drop-shadow text-gray-700">
  <ol class="grow flex flex-col-reverse overflow-y-auto">
    <li class="h-full hidden only:flex items-center justify-center">
      No messages. Enter a message below to begin.
    </li>
  </ol>
  <div class="shrink-0 w-full">
    <form class="border-t border-gray-200 p-4 space-y-2">
      <textarea
        class="block resize-none w-full border-gray-200 rounded bg-white focus:ring-0 focus:border-gray-300 focus:shadow-sm"
        placeholder="Enter a message..."
        rows={4}
      ></textarea>
      <div class="flex justify-end">
        <button class="bg-gray-200 hover:bg-gray-300 transition px-3 py-1.5 rounded flex items-center justify-center">
          Send
        </button>
      </div>
    </form>
  </div>
</div>
```

We’ll point  `/chats`  to our LiveView in the routes file:

```
 scope "/", MyAppWeb do
   pipe_through :browser

   get "/", PageController, :home
+  live "/chats", ChatsLive.Index, :index
 end
```

Lastly, let’s simplify our app layout with only the markup and styles needed. Open  `my_app_web/components/layouts/app.html.heex`  and update it to:

```
<main class="h-screen bg-slate-800">
  <%= @inner_content %>
</main>
```

At this point, if you navigate to  `/chats`, you should see a UI that looks like this:

![The initial chat UI](https://benreinhart.com/_astro/initial_chat_ui.UwZgV6Xi_Z11U2oe.webp)

## Submitting a message

In order to stream messages to our frontend, we first need to submit messages to the model for a reply. We’ll do that here.

In most Phoenix applications,  [Ecto](https://hexdocs.pm/ecto/Ecto.html)  would be used to model our data and persist it in a database. The convention is to convert our models to  [Phoenix.HTML.Form](https://hexdocs.pm/phoenix_html/Phoenix.HTML.Form.html)  objects and pass that to the  [`form`](https://hexdocs.pm/phoenix_live_view/Phoenix.Component.html#form/1)  component.

Since we’re not using a database in this tutorial and our needs are simple, we’re not going to use Phoenix’s form helpers. Instead, we’ll build the form with plain HTML and simply forward the message along to OpenAI upon form submission.

To begin, add a callback to handle form submit events on the server. This will be called when the user submits their message. In  `my_app_web/live/chats_live/index.ex`, add the below code. For now, it won’t do anything other than pattern match on an object containing a  `content`  key.

```
@impl true
def handle_event("submit", %{"content" => _content}, socket) do
  {:noreply, socket}
end
```

We need to update our view to call the above  `submit`  event when the form is submitted. This is accomplished by placing a  `phx-submit`  attribute on the form. Our server expects the  `submit`  event to contain the user input under the  `content`  key, so we must also name the textarea “content.”

```
- <form class="border-t border-gray-200 p-4 space-y-2">
+ <form phx-submit="submit" class="border-t border-gray-200 p-4 space-y-2">
    <textarea
+     name="content"
      class="block resize-none w-full border-gray-200 rounded bg-white focus:ring-0 focus:border-gray-300 focus:shadow-sm"
      placeholder="Enter a message..."
      rows={4}
```

If we type “Hello world” in the textarea and click “Send,” the form will submit over LiveView’s websocket connection, which Phoenix will log.

```
[debug] HANDLE EVENT "submit" in MyAppWeb.ChatsLive.Index
  Parameters: %{"content" => "Hello world"}
[debug] Replied in 175µs
```

All is working, but we need to render the user’s message in the UI (and later the messages from OpenAI). In a production setting, we would store these messages in a database and use  [LiveView’s streams](https://hexdocs.pm/phoenix_live_view/Phoenix.LiveView.html#stream/4)  to avoid holding all this state in memory. In this tutorial, we’re not using a database, so we will hold everything in memory.

On  `mount`, let’s add a  `messages`  key to our assigns which will initially be an empty list.

```
  def mount(_params, _session, socket) do
-   {:ok, socket}
+   {:ok, assign(socket, :messages, [])}
  end
```

When a user submits their message, we’ll add it to the list of messages. Rework the  `submit`  callback to create the new message and prepend it to the list of messages.

```
def handle_event("submit", %{"content" => content}, socket) do
  message = %{role: :user, content: content}
  updated_messages = [message | socket.assigns.messages]
  {:noreply, assign(socket, :messages, updated_messages)}
end
```

Notice that we prepend the message to the list of messages, making the list of messages in reverse chronological order. We don’t have to do it this way, but a common UI trick for rendering chat-like UIs is to use  `flex-direction: column-reverse`  to keep the container scrolled to the bottom. The messages are stored in reverse order, but our CSS will reverse it back to the correct order.

Add the (unstyled) messages to the markup.

```
  <ol class="grow flex flex-col-reverse overflow-y-auto">
+   <li :for={message <- @messages}><%= message.content %></li>
    <li class="h-full hidden only:flex items-center justify-center">
      No messages. Enter a message below to begin.
    </li>
  </ol>
```

_Note: I chose to style the empty message state as a hidden list item and use css to display it when it’s the only child of its parent. An alternative is to check the messages list to see if it’s empty and respond accordingly. I chose the CSS approach because applications using LiveView streams will not have an in-memory messages list to check the length of. Using DOM nodes as the source of truth means it will work in all cases._

With that, we can submit and store the messages on the server (in-memory) and render them in the UI.

![The chat UI with user messages](https://benreinhart.com/_astro/chat_ui_with_user_messages._LjxEPbZ_1WPgzw.webp)

## Streaming a reply

Now we have to forward the user’s message  `content`  to OpenAI for a response. We’ll use  `gpt-4`  as the model with a  `temperature`  set to  `1`.

The first thing we’ll do is create a new assign called  `running`  which will be used to indicate the model is running and we are waiting for its response.

```
  def mount(_params, _session, socket) do
-   {:ok, assign(socket, :messages, [])}
+   socket =
+     socket
+     |> assign(:messages, [])
+     |> assign(:running, false)
+
+   {:ok, socket}
  end
```

We will use this assign to disable the submit button when the model is running. This can also be used for loading states or other behavior if needed.

```
  <button
+   disabled={@running}
    class="bg-gray-200 hover:bg-gray-300 transition px-3 py-1.5 rounded flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none"
  >
    Send
  </button>
```

Now we need to send a request to OpenAI when the user submits a message. We already implemented the  `handle_event/3`  callback for this case but we did not make a request to OpenAI. Update our  `handle_event`  callback to the below code.

```
def handle_event("submit", %{"content" => content}, socket) do
  message = %{role: :user, content: content}
  updated_messages = [message | socket.assigns.messages]

  # The process id of the current LiveView
  pid = self()

  socket =
    socket
    |> assign(:running, true)
    |> assign(:messages, updated_messages)
    |> start_async(:chat_completion, fn ->
      run_chat_completion(pid, Enum.reverse(updated_messages))
    end)

  {:noreply, socket}
end
```

There are two changes here from the previous implementation:

1.  We set the  `running`  assign to  `true`.
2.  We perform the chat completion request to OpenAI asynchronously using  [LiveView’s  `start_async/3`](https://hexdocs.pm/phoenix_live_view/Phoenix.LiveView.html#start_async/3). Running asynchronously avoids blocking the LiveView process which means it remains responsive to incoming messages or other state changes, which is necessary for streaming the response. Here we also remember to reverse the messages back to chronological order since we have been storing them reversed.

`run_chat_completion/2`  is implemented as follows:

```
defp run_chat_completion(pid, messages) do
  request = %{model: "gpt-4", temperature: 1, messages: messages}

  MyApp.Openai.chat_completion(request, fn chunk ->
    case chunk do
      %{"choices" => [%{"delta" => %{"content" => content}}]} ->
        send(pid, {:chunk, content})

      _ ->
        nil
    end
  end)
end
```

This is all pretty straightforward, the main thing to call out being that we send each chunk of text from the OpenAI stream back to the LiveView process using its  `pid`  (process id).

The LiveView process then implements the  `handle_info/2`  callback, which will be responsible for receiving streaming chunks from OpenAI and forwarding them to the client.

```
@impl true
def handle_info({:chunk, chunk}, socket) do
  updated_messages =
    case socket.assigns.messages do
      [%{role: :assistant, content: content} | messages] ->
        [%{role: :assistant, content: content <> chunk} | messages]

      messages ->
        [%{role: :assistant, content: chunk} | messages]
    end

  {:noreply, assign(socket, :messages, updated_messages)}
end
```

When invoked with a  `chunk`,  `handle_info/2`  has two cases to handle:

1.  If this is the first chunk in a reply (which we determine by whether or not the most recent message is an  `assistant`  message), the callback must create a new  `assistant`  message with that chunk.
2.  For all subsequent chunks, the callback must append the chunk to the existing  `assistant`  message content.

Finally, when the chat completion request finishes, the  `handle_async/3`  callback will be invoked. This is called because we used  `start_async/3`.  `start_async/3`  calls  `handle_async/3`  when it completes with the result of the operation. Here we do not need the result as we already streamed it back to the LiveView, so the only thing we’ll want to do inside this callback is set the  `running`  assign back to  `false`.

```
@impl true
def handle_async(:chat_completion, _result, socket) do
  {:noreply, assign(socket, :running, false)}
end
```

And with that, our LiveView will stream OpenAI responses back to the client for a speedy and responsive user experience! The entire LiveView code is listed below.

```
defmodule MyAppWeb.ChatsLive.Index do
  use MyAppWeb, :live_view

  @impl true
  def mount(_params, _session, socket) do
    socket =
      socket
      |> assign(:messages, [])
      |> assign(:running, false)

    {:ok, socket}
  end

  @impl true
  def handle_event("submit", %{"content" => content}, socket) do
    message = %{role: :user, content: content}
    updated_messages = [message | socket.assigns.messages]

    # The process id of the current LiveView
    pid = self()

    socket =
      socket
      |> assign(:running, true)
      |> assign(:messages, updated_messages)
      |> start_async(:chat_completion, fn ->
        run_chat_completion(pid, Enum.reverse(updated_messages))
      end)

    {:noreply, socket}
  end

  @impl true
  def handle_async(:chat_completion, _result, socket) do
    {:noreply, assign(socket, :running, false)}
  end

  @impl true
  def handle_info({:chunk, chunk}, socket) do
    updated_messages =
      case socket.assigns.messages do
        [%{role: :assistant, content: content} | messages] ->
          [%{role: :assistant, content: content <> chunk} | messages]

        messages ->
          [%{role: :assistant, content: chunk} | messages]
      end

    {:noreply, assign(socket, :messages, updated_messages)}
  end

  defp run_chat_completion(pid, messages) do
    request = %{model: "gpt-4", temperature: 1, messages: messages}

    MyApp.Openai.chat_completion(request, fn chunk ->
      case chunk do
        %{"choices" => [%{"delta" => %{"content" => content}}]} ->
          send(pid, {:chunk, content})

        _ ->
          nil
      end
    end)
  end
end
```

## Final touches

Before wrapping up, we should improve the UX a bit. The existing messages list is unstyled and it would be nice to support some keyboard shortcuts.

### Styles

Of course, you can style this however you want. Here we’ll just add a few basic styles so we can differentiate messages from surrounding ones as well as preserve whitespace.

Change the markup that renders the list of messages to the below code.

```
<ol class="grow flex flex-col-reverse overflow-y-auto">
  <li
    :for={message <- @messages}
    class="p-4 flex items-start space-x-4 border-b first:border-b-0 hover:bg-gray-200 transition-colors"
  >
    <div class="shrink-0 pt-0.5 opacity-75">
      <svg
        :if={message.role == :assistant}
        width="24"
        height="24"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"
          fill="currentColor"
        />
      </svg>
      <svg
        :if={message.role == :user}
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      </svg>
    </div>
    <div class="leading-7 whitespace-pre-wrap"><%= message.content %></div>
  </li>
  <li class="h-full hidden only:flex items-center justify-center">
    No messages. Enter a message below to begin.
  </li>
</ol>
```

These changes will:

1.  Separate messages from each other by applying some padding and a border.
2.  Add SVG icons to differentiate user messages from assistant ones. SVGs were pulled from a google search for OpenAI and  [https://lucide.dev](https://lucide.dev/)  for the user one.
3.  Preserve whitespace. This helps readability as the models are trained to format their responses using newlines and markdown.

### Keyboard shortcuts

A nice UX touch is to allow users to type a message and then press  `cmd`+`enter`  to submit, without needing to leave the  `textarea`. This behavior is often supported for many text inputs, particularly in chat-based UIs.

To support this behavior, we need to add a  [client-side JavaScript hook](https://hexdocs.pm/phoenix_live_view/js-interop.html#client-hooks-via-phx-hook). In  `assets/js/app.js`, add the following code.

```
const SubmitOnCmdEnter = {
  mounted() {
    this.onKeydown = (e) => {
      if (e.key === "Enter" && e.metaKey) {
        this.el.form.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true })
        );
      }
    };

    this.el.addEventListener("keydown", this.onKeydown);
  },

  destroyed() {
    this.el.removeEventListener("keydown", this.onKeydown);
  },
};
```

This hook can be attached to  `input`,  `textarea`, and other form elements. It binds a callback to the  `keydown`  event. If the user presses  `cmd`+`enter`, then this will dispatch a  `submit`  event to the  `form`  that encapsulates the element. We’ll use this to submit our form through our LiveView.

We need to register this hook with LiveView’s JS client before we can attach it to our  `textarea`, which we do below in  `assets/js/app.js`.

```
  let liveSocket = new LiveSocket("/live", Socket, {
+   hooks: {SubmitOnCmdEnter},
    longPollFallbackMs: 2500,
    params: {_csrf_token: csrfToken},
  });
```

Finally, we can attach this hook to our  `textarea`  using the  `phx-hook`  attribute. Hooks require the element have a unique  `id`  set, so we add that as well.

```
  <textarea
+   id="content"
+   phx-hook="SubmitOnCmdEnter"
    name="content"
    class="block resize-none w-full border-gray-200 rounded bg-white focus:ring-0 focus:border-gray-300 focus:shadow-sm"
    placeholder="Enter a message..."
    rows={4}
  ></textarea>
```

Users can now submit messages via  `cmd`+`enter`  keyboard shortcuts!

And with that, our fully-functional steaming UI is complete!

![The completed chat UI with streaming responses](https://benreinhart.com/_astro/chat_ui_complete.3ojQf1T3_Z10Gpjx.webp)

