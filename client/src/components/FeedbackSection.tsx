import { useState } from 'react';
import { useSubmitFeedback } from '../hooks/useFeedback';

const StarButton = ({ selected, onClick }: { selected: boolean; onClick: () => void }) => (
    <button
        type="button"
        onClick={onClick}
        className={`text-3xl transition-colors ${selected ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}
    >
        ★
    </button>
);

export const FeedbackSection = () => {
    const [customerName, setCustomerName] = useState('');
    const [visitDate, setVisitDate] = useState('');
    const [rating, setRating] = useState(0);
    const [comments, setComments] = useState('');
    const { mutate: submitFeedback, isPending, isSuccess, isError, error, reset } = useSubmitFeedback();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerName.trim() || !visitDate || rating === 0) return;

        submitFeedback(
            {
                customerName: customerName.trim(),
                visitDate,
                rating,
                comments: comments.trim() || undefined,
            },
            {
                onSuccess: () => {
                    setCustomerName('');
                    setVisitDate('');
                    setRating(0);
                    setComments('');
                },
            }
        );
    };

    if (isSuccess) {
        return (
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-teal-50">
                <div className="max-w-xl mx-auto text-center">
                    <div className="bg-white rounded-2xl shadow-lg p-10 border border-teal-100">
                        <div className="text-5xl mb-4">🎉</div>
                        <h3 className="text-2xl font-bold text-teal-700 mb-2">Thank You for Your Feedback!</h3>
                        <p className="text-gray-600 mb-6">We appreciate your time and valuable input. It helps us improve our care.</p>
                        <button
                            onClick={() => { reset(); }}
                            className="rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700"
                        >
                            Submit Another Review
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-teal-50">
            <div className="max-w-xl mx-auto">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">Share Your Experience</h2>
                    <p className="text-lg text-gray-600">
                        We'd love to hear about your visit. Your feedback helps us serve you better.
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-8 border border-teal-100">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {isError && (
                            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                                {error instanceof Error ? error.message : 'Failed to submit feedback. Please try again.'}
                            </div>
                        )}

                        {/* Customer Name */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name *</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. John Doe"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                disabled={isPending}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 disabled:bg-gray-100"
                            />
                        </div>

                        {/* Visit Date */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Visit Date *</label>
                            <input
                                type="date"
                                required
                                value={visitDate}
                                onChange={(e) => setVisitDate(e.target.value)}
                                disabled={isPending}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 disabled:bg-gray-100"
                            />
                        </div>

                        {/* Rating */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Rating *</label>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <StarButton
                                        key={star}
                                        selected={rating >= star}
                                        onClick={() => !isPending && setRating(star)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Comments */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Comments</label>
                            <textarea
                                placeholder="Tell us about your experience..."
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                disabled={isPending}
                                rows={4}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 disabled:bg-gray-100 resize-none"
                            />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isPending || !customerName.trim() || !visitDate || rating === 0}
                            className="w-full rounded-lg bg-gradient-to-r from-teal-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isPending ? 'Submitting...' : 'Submit Feedback'}
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
};