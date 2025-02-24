defmodule Finessume.Test.Mocks do
  # Mock Bcrypt for tests
  defmodule MockBcrypt do
    def hash_pwd_salt(password), do: "hashed_#{password}"
    def verify_pass(password, "hashed_" <> hash), do: password == hash
    def verify_pass(_, _), do: false
  end
end
