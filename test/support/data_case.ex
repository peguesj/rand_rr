defmodule Finessume.DataCase do
  use ExUnit.CaseTemplate

  using do
    quote do
      # Import conveniences for testing with Ecto
      import Ecto
      import Ecto.Query
      import Finessume.DataCase, warn: false

      # Include mocks so they are available in all tests
      # import MyApp.Test.MockHelpers

      # Short-circuit transaction for tests that don't need it.
      # If you want a test to run in a transaction, call
      # `setup tags: :async` in your test case.
      setup tags do
        unless tags[:async] do
          Ecto.Adapters.SQL.Sandbox.checkout(Finessume.Repo)
          :ok
        else
          :ok
        end
      end
    end
  end

  setup tags do
    unless tags[:async] do
      Ecto.Adapters.SQL.Sandbox.checkout(Finessume.Repo)
    end
    :ok
  end
end
