defmodule Finessume.Seeds do
  alias Finessume.{Accounts, Resumes, Jobs}
  alias Finessume.Seeds.Config
  alias Bcrypt

  @job_titles [
    "Software Engineer",
    "Data Scientist",
    "Product Manager",
    "DevOps Engineer",
    "Security Engineer"
  ]

  @tech_skills [
    "Elixir",
    "Phoenix",
    "PostgreSQL",
    "React",
    "TypeScript",
    "Python",
    "Docker",
    "Kubernetes",
    "AWS",
    "Azure",
    "GraphQL",
    "REST",
    "Git",
    "CI/CD",
    "TDD"
  ]

  @default_emails [
    "jeremiah@pegues.io",
    Faker.Internet.email(),
    Faker.Internet.email(),
    Faker.Internet.email()
  ]
  def run(emails \\ @default_emails) do
    config = Config.new(emails: emails)
    Enum.each(config.emails, &seed_user(&1, config))
  end

  defp seed_user(email, config) do
    case Accounts.get_user_by_email(email) do
      nil ->
        {:ok, user} =
          Accounts.register_user(%{
            email: email,
            password: "password12345678",
            password_confirmation: "password12345678"
          })

        seed_resumes(user, config)
        seed_jobs(user, config)
        IO.puts("Database seeded successfully for #{email}!")

      _ ->
        IO.puts("User already exists: #{email}")
    end
  end

  defp seed_resumes(user, config) do
    Enum.map(1..config.resumes_per_user, fn _ ->
      resume_data = generate_fake_resume(config)
      {:ok, _resume} = Resumes.create_resume(Map.put(resume_data, "user_id", user.id))
    end)
  end

  defp seed_jobs(user, config) do
    Enum.map(1..config.jobs_per_user, fn _ ->
      job_data = generate_fake_job()
      {:ok, _job} = Jobs.create_job(Map.put(job_data, "user_id", user.id))
    end)
  end

  defp generate_fake_resume(config) do
    %{
      "parsed_resume_id" => Faker.UUID.v4(),
      "date_parsed" => DateTime.utc_now(),
      "parse_time" => "#{:rand.uniform(2)}.#{:rand.uniform(9)}s",
      "source" => %{"type" => "generated", "generator" => "faker"},
      "data" => %{
        "personalInfo" => generate_personal_info(),
        "summary" => generate_summary(),
        "workExperience" => generate_work_experience(config.experience_entries_per_resume),
        "education" => generate_education(config.education_entries_per_resume),
        "skills" => generate_skills(config.skills_per_resume),
        "certifications" => generate_certifications()
      }
    }
  end

  defp generate_personal_info do
    %{
      "id" => "personal-#{Faker.UUID.v4()}",
      "name" => Faker.Person.name(),
      "contactDetails" => %{
        "id" => "contact-#{Faker.UUID.v4()}",
        "email" => Faker.Internet.email(),
        "phoneNumber" => Faker.Phone.EnUs.phone(),
        "address" => "#{Faker.Address.city()}, #{Faker.Address.state_abbr()}"
      }
    }
  end

  defp generate_summary do
    %{
      "id" => "summary-#{Faker.UUID.v4()}",
      "content" => """
      #{Faker.Person.title()} with #{:rand.uniform(15) + 5} years of experience in
      #{Enum.take_random(@tech_skills, 3) |> Enum.join(", ")}.
      Proven track record of #{Faker.Company.catch_phrase()} and
      #{Faker.Company.bs()}. Skilled in leading teams and delivering
      high-impact projects in the #{Faker.Commerce.department()} sector.
      """
    }
  end

  defp generate_work_experience(entries) do
    %{
      "id" => "workExp-#{Faker.UUID.v4()}",
      "display" => "traditional",
      "items" => Enum.map(1..entries, &generate_work_entry/1)
    }
  end

  defp generate_work_entry(_) do
    end_date = Faker.Date.backward(365 * 2)
    start_date = Faker.Date.backward(365 * 4)

    %{
      "id" => "we-#{Faker.UUID.v4()}",
      "position" => Enum.random(@job_titles),
      "company" => Faker.Company.name(),
      "start_date" => Date.to_iso8601(start_date),
      "end_date" => Date.to_iso8601(end_date),
      "operations" =>
        Enum.map(1..3, fn _ ->
          "#{Faker.Company.buzzword()} #{Faker.Company.bs()} resulting in #{:rand.uniform(90) + 10}% improvement"
        end),
      "achievements" =>
        Enum.map(1..3, fn _ ->
          "#{Faker.Company.buzzword()} #{Faker.Company.catch_phrase()} leading to #{:rand.uniform(50) + 50}% efficiency gain"
        end)
    }
  end

  defp generate_education(entries) do
    %{
      "id" => "edu-#{Faker.UUID.v4()}",
      "items" => Enum.map(1..entries, &generate_education_entry/1)
    }
  end

  defp generate_education_entry(_) do
    end_date = Faker.Date.backward(365 * 5)
    # 4 years earlier
    start_date = Date.add(end_date, -1460)

    %{
      "id" => "eduEntry-#{Faker.UUID.v4()}",
      "degree" =>
        "#{Enum.random(["Bachelor of Science", "Master of Science"])} in #{Enum.random(["Computer Science", "Software Engineering", "Information Technology"])}",
      "institution" => "#{Faker.Company.name()} University",
      "start_date" => Date.to_iso8601(start_date),
      "end_date" => Date.to_iso8601(end_date),
      "description" => Faker.Company.catch_phrase()
    }
  end

  defp generate_skills(count) do
    %{
      "id" => "skills-#{Faker.UUID.v4()}",
      "items" =>
        Enum.map(Enum.take_random(@tech_skills, count), fn skill ->
          %{
            "id" => "skill-#{Faker.UUID.v4()}",
            "skill" => skill
          }
        end)
    }
  end

  defp generate_certifications do
    %{
      "id" => "certs-#{Faker.UUID.v4()}",
      "items" =>
        Enum.map(1..2, fn _ ->
          %{
            "id" => "cert-#{Faker.UUID.v4()}",
            "name" =>
              "#{Enum.random(@tech_skills)} #{Enum.random(["Professional", "Expert", "Master"])} Certification",
            "institution" => Faker.Company.name(),
            "date" => Date.to_iso8601(Faker.Date.backward(365))
          }
        end)
    }
  end

  defp generate_fake_job do
    %{
      "title" => Enum.random(@job_titles),
      "company" => Faker.Company.name(),
      "description" => Faker.Company.catch_phrase(),
      "requirements" => Enum.take_random(@tech_skills, 5),
      "location" => "#{Faker.Address.city()}, #{Faker.Address.state_abbr()}",
      "status" => "active"
    }
  end
end
