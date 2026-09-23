import EventForm from "@/component/EventForm";

export default async function EditEventPage({ params }) {
  const { id } = await params;

  return <EventForm eventId={id} />;
}