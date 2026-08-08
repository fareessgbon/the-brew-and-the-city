// Step indicator for the multi-step surveys. Both survey forms rendered the
// same bare "Step N of M" line; this keeps that text (it's what screen
// readers get, and it's the precise version) and adds a filled track above
// it so sighted users can judge remaining effort without reading a sentence.
//
// The track is aria-hidden because the text beside it already states the
// same thing — announcing both would just repeat it.
export function SurveyProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="quiz-progress">
      <div className="quiz-progress-track" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} data-done={i <= step} />
        ))}
      </div>
      Step {step + 1} of {total}
    </div>
  );
}
