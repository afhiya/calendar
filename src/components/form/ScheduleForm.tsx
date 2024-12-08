"use client";

import { DAYS_OF_WEEK_IN_ORDER } from "@/data/constants";
import { formatTimezoneOffSet } from "@/lib/formatters";
import { timeToInt } from "@/lib/utils";
import { scheduleFormSchema } from "@/schema/schedule";
import { createEvent, updateEvent } from "@/server/actions/events";
import { zodResolver } from "@hookform/resolvers/zod";
import { Fragment, useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Plus, Trash } from "lucide-react";
import { Input } from "../ui/input";
import { saveSchedule } from "@/server/actions/schedule";

type Availability = {
  startTime: string;
  endTime: string;
  dayOfWeek: (typeof DAYS_OF_WEEK_IN_ORDER)[number];
};

export function ScheduleForm({
  schedule,
}: {
  schedule?: {
    timezone: string;
    availabilities: Availability[];
  };
}) {
  const [succesMessage, setSuccesMessage] = useState<string>()
  const [isDeletePending, startDeleteTransition] = useTransition();
  const form = useForm<z.infer<typeof scheduleFormSchema>>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      timezone:
        schedule?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
      availabilities: schedule?.availabilities.toSorted((a, b) => {
        return timeToInt(a.startTime) - timeToInt(b.startTime);
      }),
    },
  });

  const {
    append: addAvailability,
    remove: removeAvailability,
    fields: avabilityFields,
  } = useFieldArray({ name: "availabilities", control: form.control });

  const groupAvabilityFields = Object.groupBy(
    avabilityFields.map((field, index) => ({ ...field, index })),
    (availability) => availability.dayOfWeek
  );

  async function onSubmit(values: z.infer<typeof scheduleFormSchema>) {
    const data = await saveSchedule(values);

    if (data?.error) {
      form.setError("root", {
        message: "There was an error saving your schedule",
      });
    } else {
      setSuccesMessage("Schedule saved successfully");
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex gap-6 flex-col"
      >
        {form.formState.errors.root && (
          <p className="text-destructive text-sm">
            {form.formState.errors.root.message}
          </p>
        )}
        {succesMessage && <p className="text-green-600 text-sm">{succesMessage}</p>}
        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timezone</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Intl.supportedValuesOf("timeZone").map((timezone) => (
                    <SelectItem key={timezone} value={timezone}>
                      {timezone}
                      {`${formatTimezoneOffSet(timezone)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-[auto,1fr] gap-y-6 gap-x-4">
          {DAYS_OF_WEEK_IN_ORDER.map((dayOfWeek) => (
            <Fragment key={dayOfWeek}>
              <div className="capitalize text-sm font-semibold">
                {dayOfWeek}
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="size-6 p-1"
                  onClick={() =>
                    addAvailability({ dayOfWeek, startTime: "9:00", endTime: "17:00" })
                  }
                >
                  <Plus className="size-full p-1" />
                </Button>
                {groupAvabilityFields[dayOfWeek]?.map((field, labelIndex) => (
                  <div className="flex flex-col gap-1" key={field.id}>
                    <div className="flex gap-2 items-center">
                      <FormField
                        control={form.control}
                        name={`availabilities.${field.index}.startTime`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                className="w-24"
                                aria-label={`${labelIndex} Start Time ${
                                  labelIndex + 1
                                }`}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`availabilities.${field.index}.endTime`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                className="w-24"
                                aria-label={`${labelIndex} End Time ${
                                  labelIndex + 1
                                }`}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="destructiveGhost"
                        className="size-5 p-1"
                        onClick={() => removeAvailability(field.index)}
                      >
                        <Trash className="size-full p-1" />
                      </Button>
                    </div>
                    <FormMessage>
                      {
                        form.formState.errors.availabilities?.at?.(field.index)
                          ?.root?.message
                      }
                    </FormMessage>
                    <FormMessage>
                      {
                        form.formState.errors.availabilities?.at?.(field.index)
                          ?.startTime?.message
                      }
                    </FormMessage>
                    <FormMessage>
                      {
                        form.formState.errors.availabilities?.at?.(field.index)
                          ?.endTime?.message
                      }
                    </FormMessage>
                  </div>
                ))}
              </div>
            </Fragment>
          ))}
        </div>
        <div className="flex gap-2 justify-end">
          <Button
            disabled={isDeletePending || form.formState.isSubmitting}
            type="submit"
          >
            Save
          </Button>
        </div>
      </form>
    </Form>
  );
}