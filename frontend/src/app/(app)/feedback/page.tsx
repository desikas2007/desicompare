'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Star } from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';
import { feedbackService } from '@/services/feedback.service';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Field, Select, Textarea } from '@/components/ui/Form';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { ApiError } from '@/lib/api-client';
import { formatDate } from '@/lib/format';
import { feedbackSchema, FeedbackValues } from '@/lib/validation';
import { FeedbackCategoryEnum, FeedbackStatusEnum, FeedbackStatus } from '@/types';

type BadgeTone = 'info' | 'warning' | 'success' | 'neutral';

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General feedback',
  app_experience: 'App experience',
  restaurant: 'Restaurant',
  dish: 'Dish / menu',
  pricing: 'Pricing & offers',
  delivery: 'Delivery',
  bug: 'Bug report',
  other: 'Something else',
};

const CATEGORY_OPTIONS = Object.values(FeedbackCategoryEnum).map((value) => ({
  value,
  label: CATEGORY_LABELS[value] ?? value,
}));

const STATUS_META: Record<FeedbackStatus, { label: string; tone: BadgeTone }> = {
  [FeedbackStatusEnum.New]: { label: 'Received', tone: 'info' },
  [FeedbackStatusEnum.InReview]: { label: 'In review', tone: 'warning' },
  [FeedbackStatusEnum.Resolved]: { label: 'Resolved', tone: 'success' },
  [FeedbackStatusEnum.Dismissed]: { label: 'Closed', tone: 'neutral' },
};

function StarRow({ value }: { value: number | null }) {
  return (
    <span className="flex items-center gap-0.5 text-warning" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          className={star <= (value ?? 0) ? 'fill-current' : 'opacity-35'}
        />
      ))}
    </span>
  );
}

export default function FeedbackPage() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FeedbackValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { category: 'general', rating: undefined, message: '' },
  });

  const rating = form.watch('rating');

  const history = useQuery({
    queryKey: ['feedback'],
    queryFn: () => feedbackService.listMine(),
  });

  const submit = useMutation({
    mutationFn: (values: FeedbackValues) =>
      feedbackService.create({
        category: values.category,
        rating: values.rating ?? undefined,
        message: values.message,
      }),
    onSuccess: () => {
      toast.success('Thanks! Your feedback has been sent to our team.');
      form.reset({ category: 'general', rating: undefined, message: '' });
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiError ? error.message : 'Could not send feedback');
    },
  });

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Customer feedback
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Tell us what works, what doesn&apos;t, and what we should build next. Every submission
          is reviewed by our team.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-primary" />
            <h2 className="text-lg font-bold text-ink">Share feedback</h2>
          </div>

          <form
            className="mt-4 flex flex-col gap-4"
            onSubmit={form.handleSubmit((values) => submit.mutate(values))}
            noValidate
          >
            <Field
              label="What is this about?"
              htmlFor="fb-category"
              error={form.formState.errors.category?.message}
            >
              <Select id="fb-category" {...form.register('category')}>
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Your rating" htmlFor="fb-rating" hint="Optional. 1 is poor, 5 is excellent.">
              <div id="fb-rating" className="flex items-center gap-1 pt-1" role="group" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                    aria-pressed={rating === star}
                    onClick={() => form.setValue('rating', star, { shouldDirty: true })}
                    className="rounded p-1 text-warning transition-transform hover:scale-110"
                  >
                    <Star
                      size={24}
                      className={star <= (rating ?? 0) ? 'fill-current' : 'opacity-35'}
                    />
                  </button>
                ))}
                {rating ? (
                  <button
                    type="button"
                    onClick={() => form.setValue('rating', undefined, { shouldDirty: true })}
                    className="ml-2 text-xs text-muted underline-offset-2 hover:underline"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </Field>

            <Field
              label="Your message"
              htmlFor="fb-message"
              hint={`${form.watch('message').length}/2000 characters`}
              error={form.formState.errors.message?.message}
            >
              <Textarea
                id="fb-message"
                rows={6}
                placeholder="Share the details of your experience, idea or problem..."
                {...form.register('message')}
              />
            </Field>

            <div>
              <Button type="submit" loading={submit.isPending}>
                Send feedback
              </Button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-bold text-ink">Your submissions</h2>
          <div className="mt-4">
            {history.isLoading ? (
              <Skeleton height={120} radius={12} />
            ) : history.isError ? (
              <ErrorState
                title="Could not load your feedback"
                message="Please try again in a moment."
              />
            ) : history.data && history.data.length ? (
              <div className="flex flex-col gap-3">
                {history.data.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-xl border border-line bg-surface-alt/40 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-ink">
                        {CATEGORY_LABELS[item.category] ?? item.category}
                      </span>
                      <Badge tone={STATUS_META[item.status]?.tone ?? 'neutral'}>
                        {STATUS_META[item.status]?.label ?? item.status}
                      </Badge>
                    </div>
                    {item.rating ? (
                      <div className="mt-1.5">
                        <StarRow value={item.rating} />
                      </div>
                    ) : null}
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-ink-soft">
                      {item.message}
                    </p>
                    <p className="mt-2 text-xs text-muted">Sent {formatDate(item.createdAt)}</p>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No feedback yet"
                message="Your submitted feedback and its review status will appear here."
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
