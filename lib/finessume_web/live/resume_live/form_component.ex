defmodule FinessumeWeb.ResumeLive.FormComponent do
  use FinessumeWeb, :live_component

  alias Finessume.Resumes

  @impl true
  def update(%{resume: resume} = assigns, socket) do
    changeset = Resumes.change_resume(resume)

    {:ok,
     socket
     |> assign(assigns)
     |> assign(:changeset, changeset)}
  end

  @impl true
  def handle_event("validate", %{"resume" => resume_params}, socket) do
    changeset =
      socket.assigns.resume
      |> Resumes.change_resume(resume_params)
      |> Map.put(:action, :validate)

    {:noreply, assign(socket, :changeset, changeset)}
  end

  def handle_event("save", %{"resume" => resume_params}, socket) do
    save_resume(socket, socket.assigns.action, resume_params)
  end

  defp save_resume(socket, :edit, resume_params) do
    case Resumes.update_resume(socket.assigns.resume, resume_params) do
      {:ok, _resume} ->
        {:noreply,
         socket
         |> put_flash(:info, "Resume updated successfully")
         |> push_navigate(to: socket.assigns.return_to)}

      {:error, %Ecto.Changeset{} = changeset} ->
        {:noreply, assign(socket, :changeset, changeset)}
    end
  end

  defp save_resume(socket, :new, resume_params) do
    case Resumes.create_resume(resume_params) do
      {:ok, _resume} ->
        {:noreply,
         socket
         |> put_flash(:info, "Resume created successfully")
         |> push_navigate(to: socket.assigns.return_to)}

      {:error, %Ecto.Changeset{} = changeset} ->
        {:noreply, assign(socket, changeset: changeset)}
    end
  end
end
