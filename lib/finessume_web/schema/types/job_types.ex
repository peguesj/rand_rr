defmodule FinessumeWeb.Schema.Types.JobTypes do
  use Absinthe.Schema.Notation

  object :job do
    field(:id, :id)
    field(:job_posting_id, :string)
    field(:metadata, :job_metadata)
    field(:position, :job_position)
    field(:organization, :organization)
    field(:compensation, :compensation)
    field(:requirements, :requirements)
    field(:description, :job_description)
    field(:application, :application)
  end

  object :job_metadata do
    field(:source, :string)
    field(:post_date, :datetime)
    field(:status, :string)
  end

  enum :employment_type do
    value(:full_time)
    value(:part_time)
    value(:contract)
    value(:temporary)
    value(:internship)
  end

  # Additional type definitions...
end
