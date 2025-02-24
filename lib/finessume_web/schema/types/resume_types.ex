defmodule FinessumeWeb.Schema.Types.ResumeTypes do
  use Absinthe.Schema.Notation

  import_types(FinessumeWeb.Schema.Types.CustomTypes)

  object :resume do
    field(:id, :id)
    field(:parsed_resume_id, :string)
    field(:source, :resume_source)
    field(:date_parsed, :datetime)
    field(:parse_time, :string)
    field(:data, :resume_data)
    field(:schema_version, :string)
  end

  object :resume_source do
    field(:type, :string)
    field(:raw_resume_id, :string)
  end

  object :resume_data do
    field(:personal_info, :personal_info)
    field(:summary, :summary)
    field(:work_experience, :work_experience)
    field(:skills, :skills)
    field(:education, :education)
  end

  # Additional type definitions...
end
