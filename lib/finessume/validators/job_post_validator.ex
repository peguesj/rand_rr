defmodule Finessume.Validators.JobPostValidator do
  alias Finessume.Jobs.Job

  def validate_json(json_file) do
    json_string = File.read!(json_file)
    data = Jason.decode!(json_string)

    changeset = Job.changeset(%Job{}, data)

    if Enum.empty?(changeset.errors) do
      IO.puts("#{json_file} is valid")
    else
      IO.puts("#{json_file} is invalid")
      IO.inspect(changeset.errors) # Uncomment to inspect errors
    end
  rescue
    e ->
      IO.puts("Error processing #{json_file}: #{inspect(e)}")
  end
end
