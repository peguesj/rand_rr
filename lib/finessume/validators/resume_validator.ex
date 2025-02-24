defmodule Finessume.Validators.ResumeValidator do
  alias Finessume.Resumes.Resume

  def validate_json(json_file) do
    json_string = File.read!(json_file)
    data = Jason.decode!(json_string)

    changeset = Resume.changeset(%Resume{}, data)

    if Enum.empty?(changeset.errors) do
      IO.puts("#{json_file} is valid")
    else
      IO.puts("#{json_file} is invalid")
      # Uncomment to inspect errors
      IO.inspect(changeset.errors)
    end
  rescue
    e ->
      IO.puts("Error processing #{json_file}: #{inspect(e)}")
  end
end
