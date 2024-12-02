import { EventForm } from "@/components/form/EventForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/drizzle/db";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

export const revalidate = 0

export default async function EditEventPage({ params: { eventId }}: { params: { eventId: string }} ) {
  const { userId, redirectToSignIn } = await auth()
  if(userId == null) redirectToSignIn()

    const event = await db.query.EventTable.findFirst({
      where: userId ? ({ id, clerkUserId }, { and, eq }) => and(eq(clerkUserId, userId), eq(id, eventId)) : undefined
    })

    if(event == null) return notFound()
  
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Edit Event</CardTitle>
      </CardHeader>
      <CardContent>
        <EventForm event={{ ...event, description: event.description ?? undefined }} />
      </CardContent>
    </Card>
  );
}