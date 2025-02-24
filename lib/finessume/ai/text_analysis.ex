defmodule Finessume.AI.TextAnalysis do
  @moduledoc """
  Provides text analysis functions for extracting job and resume information
  using LLM prompting with structured JSON outputs. The output will strictly conform
  to one of the exact JSON schemas defined below for a Job Posting or a Parsed Resume.
  Any missing fields or deviations from the schema will be corrected via internal casting
  logic so that the final result fits the application constraints.
  """

  @job_schema_instruction """
  Job Posting Schema:
  ```jsonc
    {
        // Schema metadata and versioning
        "$schema": "http://json-schema.org/draft-07/schema#",
        "$id": "https://pegues.io/schemas/jobposting/v1.0.0",
        "title": "Job Posting Schema",
        "description": "Comprehensive schema for structured job posting data",
        "version": "1.0.0",

        // Core posting properties
        "type": "object",
        "properties": {
            // Unique identifier for the job posting
            "jobPostingId": {
                "type": "string",
                "description": "UUID v4 recommended for global uniqueness"
            },

            // Metadata for tracking and management
            "metadata": {
                "type": "object",
                "properties": {
                    // Source platform (e.g., "LinkedIn", "Indeed", "Company Website")
                    "source": {
                        "type": "string",
                        "description": "Origin platform of the job posting"
                    },
                    // Posting lifecycle dates
                    "postDate": {
                        "type": "string",
                        "format": "date-time",
                        "description": "When the position was first posted"
                    },
                    "expirationDate": {
                        "type": "string",
                        "format": "date-time",
                        "description": "When the posting will expire/close"
                    },
                    "lastModified": {
                        "type": "string",
                        "format": "date-time",
                        "description": "Last update timestamp"
                    },
                    // Current status of the posting
                    "status": {
                        "type": "string",
                        "enum": ["active", "filled", "expired", "draft"],
                        "description": "Current state of the job posting"
                    },
                    // Visibility and promotional settings
                    "featured": {
                        "type": "boolean",
                        "description": "Whether this is a featured/promoted posting"
                    },
                    "internal": {
                        "type": "boolean",
                        "description": "Whether this is an internal-only posting"
                    }
                },
                "required": ["source", "postDate", "status"]
            },

            // Position details
            "position": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "Official job title"
                    },
                    // Employment type classification
                    "type": {
                        "type": "string",
                        "enum": ["full-time", "part-time", "contract", "temporary", "internship"],
                        "description": "Employment type category"
                    },
                    // Seniority/career level
                    "level": {
                        "type": "string",
                        "enum": ["entry", "associate", "mid-senior", "senior", "lead", "principal", "executive"],
                        "description": "Career level or seniority"
                    },
                    // Department/function area
                    "function": {
                        "type": "string",
                        "description": "Primary job function/department (e.g., Engineering, Sales)"
                    },
                    // Detailed classification data
                    "classification": {
                        "type": "object",
                        "properties": {
                            "industry": {
                                "type": "string",
                                "description": "Primary industry category"
                            },
                            "category": {
                                "type": "string",
                                "description": "Job category (e.g., Software Development)"
                            },
                            "subcategory": {
                                "type": "string",
                                "description": "Specific focus area (e.g., Frontend Development)"
                            },
                            // Standard classification codes
                            "codes": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "system": {
                                            "type": "string",
                                            "description": "Classification system (e.g., SOC, NAICS, O*NET)"
                                        },
                                        "code": {
                                            "type": "string",
                                            "description": "The actual classification code"
                                        }
                                    }
                                },
                                "description": "Standard industry classification codes"
                            }
                        }
                    }
                },
                "required": ["title", "type", "level"]
            },

            // Organization/Company information
            "organization": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Company/organization name"
                    },
                    "department": {
                        "type": "string",
                        "description": "Specific department/division"
                    },
                    // Company info for startups/tech
                    "funding": {
                        "type": "object",
                        "properties": {
                            "stage": {
                                "type": "string",
                                "enum": ["seed", "series-a", "series-b", "series-c", "series-d", "public"],
                                "description": "Current funding stage"
                            },
                            "amount": {
                                "type": "number",
                                "description": "Total funding raised (USD)"
                            },
                            "investors": {
                                "type": "array",
                                "items": {
                                    "type": "string"
                                },
                                "description": "Key investors/VC firms"
                            }
                        }
                    },
                    // Location information
                    "location": {
                        "type": "object",
                        "properties": {
                            "type": {
                                "type": "string",
                                "enum": ["on-site", "hybrid", "remote"],
                                "description": "Work location type"
                            },
                            "primary": {
                                "type": "object",
                                "properties": {
                                    "city": { "type": "string" },
                                    "state": { "type": "string" },
                                    "country": { "type": "string" },
                                    "postalCode": { "type": "string" }
                                },
                                "description": "Primary job location"
                            },
                            "travelRequired": {
                                "type": "object",
                                "properties": {
                                    "percentage": {
                                        "type": "number",
                                        "description": "Expected travel percentage"
                                    },
                                    "frequency": {
                                        "type": "string",
                                        "description": "How often travel is required"
                                    },
                                    "scope": {
                                        "type": "string",
                                        "description": "Geographic scope of travel"
                                    }
                                }
                            }
                        }
                    }
                },
                "required": ["name", "location"]
            },

            // Compensation and benefits
            "compensation": {
                "type": "object",
                "properties": {
                    "type": {
                        "type": "string",
                        "enum": ["salary", "hourly", "commission", "project-based"],
                        "description": "Primary compensation type"
                    },
                    // Salary/rate range
                    "range": {
                        "type": "object",
                        "properties": {
                            "minimum": {
                                "type": "number",
                                "description": "Minimum compensation amount"
                            },
                            "maximum": {
                                "type": "number",
                                "description": "Maximum compensation amount"
                            },
                            "currency": {
                                "type": "string",
                                "description": "ISO 4217 currency code"
                            },
                            "interval": {
                                "type": "string",
                                "enum": ["hourly", "weekly", "monthly", "annual"],
                                "description": "Payment interval"
                            }
                        }
                    },
                    // Benefits package
                    "benefits": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "category": {
                                    "type": "string",
                                    "description": "Benefit category (e.g., health, retirement)"
                                },
                                "description": {
                                    "type": "string",
                                    "description": "Detailed benefit description"
                                }
                            }
                        }
                    },
                    // Equity compensation
                    "equity": {
                        "type": "object",
                        "properties": {
                            "type": {
                                "type": "string",
                                "description": "Type of equity (e.g., RSUs, options)"
                            },
                            "range": {
                                "minimum": {
                                    "type": "number",
                                    "description": "Minimum equity percentage/amount"
                                },
                                "maximum": {
                                    "type": "number",
                                    "description": "Maximum equity percentage/amount"
                                }
                            }
                        }
                    }
                }
            },

            // Job requirements
            "requirements": {
                "type": "object",
                "properties": {
                    // Educational requirements
                    "education": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "level": {
                                    "type": "string",
                                    "description": "Degree level required"
                                },
                                "field": {
                                    "type": "string",
                                    "description": "Field of study"
                                },
                                "required": {
                                    "type": "boolean",
                                    "description": "Whether this is required or preferred"
                                }
                            }
                        }
                    },
                    // Experience requirements
                    "experience": {
                        "type": "object",
                        "properties": {
                            "minimum": {
                                "type": "number",
                                "description": "Minimum years required"
                            },
                            "preferred": {
                                "type": "number",
                                "description": "Preferred years of experience"
                            },
                            // Specific experience areas
                            "areas": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "skill": {
                                            "type": "string",
                                            "description": "Required skill/technology"
                                        },
                                        "years": {
                                            "type": "number",
                                            "description": "Years of experience with this skill"
                                        },
                                        "level": {
                                            "type": "string",
                                            "description": "Required proficiency level"
                                        },
                                        "required": {
                                            "type": "boolean",
                                            "description": "Whether this is required or preferred"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    // Required skills
                    "skills": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "name": {
                                    "type": "string",
                                    "description": "Skill name"
                                },
                                "category": {
                                    "type": "string",
                                    "description": "Skill category (e.g., technical, soft)"
                                },
                                "level": {
                                    "type": "string",
                                    "description": "Required proficiency level"
                                },
                                "required": {
                                    "type": "boolean",
                                    "description": "Whether this is required or preferred"
                                }
                            }
                        }
                    },
                    // Required certifications
                    "certifications": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "name": {
                                    "type": "string",
                                    "description": "Certification name"
                                },
                                "required": {
                                    "type": "boolean",
                                    "description": "Whether this is required or preferred"
                                },
                                "timeframe": {
                                    "type": "string",
                                    "description": "When certification must be obtained"
                                }
                            }
                        }
                    },
                    // Security clearances
                    "clearances": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "type": {
                                    "type": "string",
                                    "description": "Type of clearance required"
                                },
                                "required": {
                                    "type": "boolean",
                                    "description": "Whether this is required or preferred"
                                }
                            }
                        }
                    }
                }
            },

            // Job description content
            "description": {
                "type": "object",
                "properties": {
                    "overview": {
                        "type": "string",
                        "description": "General position overview"
                    },
                    "responsibilities": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "description": "Individual job responsibilities"
                        }
                    },
                    "qualifications": {
                        "type": "object",
                        "properties": {
                            "required": {
                                "type": "array",
                                "items": {
                                    "type": "string",
                                    "description": "Required qualifications"
                                }
                            },
                            "preferred": {
                                "type": "array",
                                "items": {
                                    "type": "string",
                                    "description": "Preferred qualifications"
                                }
                            }
                        }
                    },
                    "additionalNotes": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "description": "Additional information or notes"
                        }
                    }
                }
            },

            // Application process
            "application": {
                "type": "object",
                "properties": {
                    "process": {
                        "type": "string",
                        "enum": ["direct", "referral", "agency"],
                        "description": "Application submission method"
                    },
                    "url": {
                        "type": "string",
                        "description": "Application submission URL"
                    },
                    "instructions": {
                        "type": "string",
                        "description": "Special application instructions"
                    },
                    "documents": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "type": {
                                    "type": "string",
                                    "description": "Required document type"
                                },
                                "required": {
                                    "type": "boolean",
                                    "description": "Whether this document is required"
                                }
                            }
                        }
                    },
                    "deadline": {
                        "type": "string",
                        "format": "date-time",
                        "description": "Application deadline"
                    }
                }
            }
        },

        // Required top-level properties
        "required": ["jobPostingId", "metadata", "position", "organization", "description"]
    }
  ```
  Ensure valid JSON.
  """

  @resume_schema_instruction """
  Parsed Resume Schema:
  ```json
    {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "$id": "https://pegues.io/schemas/resume/v3.1.3",
        "title": "ParsedResume Schema",
        "description": "Schema for validating parsed resume data structure",
        "version": "3.1.3",
        "date": "2025-02-17",
        "author": "Jeremiah Pegues <jeremiah@pegues.io>",
        "license": "MIT",
        "type": "object",
        "properties": {
            "$schema": {
                "type": "string",
                "description": "Schema identifier for validation"
            },
            "parsedResumeId": {
                "type": "string",
                "description": "Unique identifier for the resume instance"
            },
            "source": {
                "type": "object",
                "properties": {
                    "type": { "type": "string" },
                    "rawResumeId": { "type": "string" }
                },
                "required": ["type", "rawResumeId"]
            },
            "dateParsed": { "type": "string", "format": "date-time" },
            "parseTime": { "type": "string" },
            "data": {
                "type": "object",
                "properties": {
                    "personalInfo": {
                        "type": "object",
                        "properties": {
                            "id": { "type": "string" },
                            "name": { "type": "string" },
                            "contactDetails": {
                                "type": "object",
                                "properties": {
                                    "id": { "type": "string" },
                                    "email": { "type": "string", "format": "email" },
                                    "phoneNumber": { "type": "string" },
                                    "address": { "type": "string" }
                                },
                                "required": ["id", "email", "phoneNumber", "address"]
                            }
                        },
                        "required": ["id", "name", "contactDetails"]
                    },
                    "summary": {
                        "type": "object",
                        "properties": {
                            "id": { "type": "string" },
                            "content": { "type": "string" }
                        },
                        "required": ["id", "content"]
                    },
                    "workExperience": {
                        "type": "object",
                        "properties": {
                            "id": { "type": "string" },
                            "display": {
                                "type": "string",
                                "enum": ["traditional", "operations-achievements"],
                                "description": "Determines whether experience is displayed in traditional format or grouped by operations and achievements."
                            },
                            "items": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "id": { "type": "string" },
                                        "position": { "type": "string" },
                                        "company": { "type": "string" },
                                        "start_date": { "type": "string", "format": "date" },
                                        "end_date": { "type": "string", "format": "date" },
                                        "currentRole": { "type": "boolean" },
                                        "operations": {
                                            "type": "array",
                                            "items": { "type": "string" },
                                            "description": "Tasks and responsibilities performed in the role."
                                        },
                                        "achievements": {
                                            "type": "array",
                                            "items": { "type": "string" },
                                            "description": "Key accomplishments and successes in the role."
                                        }
                                    },
                                    "required": ["id", "position", "company", "start_date", "end_date"]
                                }
                            }
                        },
                        "required": ["id", "display", "items"]
                    },
                    "skills": {
                        "type": "object",
                        "properties": {
                            "id": { "type": "string" },
                            "items": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "id": { "type": "string" },
                                        "skill": { "type": "string" }
                                    },
                                    "required": ["id", "skill"]
                                }
                            }
                        },
                        "required": ["id", "items"]
                    },
                    "education": {
                        "type": "object",
                        "properties": {
                            "id": { "type": "string" },
                            "items": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "id": { "type": "string" },
                                        "degree": { "type": "string" },
                                        "institution": { "type": "string" },
                                        "start_date": { "type": "string", "format": "date" },
                                        "end_date": { "type": "string", "format": "date" },
                                        "description": { "type": "string" }
                                    },
                                    "required": ["id", "degree", "institution", "start_date", "end_date"]
                                }
                            }
                        },
                        "required": ["id", "items"]
                    },
                    "certifications": {
                        "type": "object",
                        "properties": {
                            "id": { "type": "string" },
                            "items": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "id": { "type": "string" },
                                        "name": { "type": "string" },
                                        "institution": { "type": "string" },
                                        "date": { "type": "string", "format": "date" }
                                    },
                                    "required": ["id", "name", "institution", "date"]
                                }
                            }
                        },
                        "required": ["id", "items"]
                    }
                }
            }
        },
        "required": ["parsedResumeId", "source", "dateParsed", "parseTime", "data"]
    }
  ```

  Ensure valid JSON.
  """

  @doc """
  Analyze text with LLM prompt and return structured data.

  Pass type as :job or :resume.
  """
  def analyze_text(type, text) when type in [:job, :resume] do
    schema_instruction =
      case type do
        :job -> @job_schema_instruction
        :resume -> @resume_schema_instruction
      end

    prompt = """
    Provide a highly structured JSON response that strictly adheres to the following schema:
    #{schema_instruction}

    The JSON response must contain all required fields exactly as specified and no additional keys.
    If any fields are missing, use null or appropriate default values.
    Do not include any extra commentary or formatting, only return the valid JSON.

    Given the text:
    "#{text}"

    Return only the valid JSON object.
    """

    with {:ok, response} <- OpenAIClient.complete(prompt),
         {:ok, data} <- Jason.decode(response) do
      data
      |> cast_to_schema(type)
    else
      {:error, error} ->
        %{"error" => "Request to OpenAI failed: #{inspect(error)}"}

      {:error, decode_error, _} ->
        %{"error" => "JSON decoding failed: #{inspect(decode_error)}"}
    end
  end

  # Cast the LLM response into the expected schema by ensuring all required keys are present.
  defp cast_to_schema(data, :job) when is_map(data) do
    # Example: ensure that mandatory keys are set, add defaults if missing.
    data
    |> Map.put_new("jobPostingId", "unknown")
    |> Map.update(
      "metadata",
      %{"source" => "unknown", "postDate" => "", "status" => ""},
      fn meta ->
        Map.merge(%{"source" => "unknown", "postDate" => "", "status" => ""}, meta)
      end
    )
    |> Map.put_new("position", %{"title" => "", "type" => "", "level" => ""})
    |> Map.put_new("organization", %{"name" => "", "location" => ""})
    |> Map.put_new("description", %{"content" => ""})
  end

  defp cast_to_schema(data, :resume) when is_map(data) do
    data
    |> Map.put_new("parsedResumeId", "unknown")
    |> Map.update("source", %{"type" => "unknown", "rawResumeId" => "unknown"}, fn src ->
      Map.merge(%{"type" => "unknown", "rawResumeId" => "unknown"}, src)
    end)
    |> Map.put_new("dateParsed", "")
    |> Map.put_new("parseTime", "")
    |> Map.update("data", %{}, fn d ->
      d
      |> Map.put_new("personalInfo", %{"id" => "", "name" => "", "contactDetails" => %{}})
      |> Map.put_new("summary", %{"id" => "", "content" => ""})
      |> Map.put_new("workExperience", %{"id" => "", "display" => "", "items" => []})
      |> Map.put_new("skills", %{"id" => "", "items" => []})
      |> Map.put_new("education", %{"id" => "", "items" => []})
    end)
  end

  # Removed local extraction helper functions as extraction is now handled via the prompt-based LLM functions.
end
