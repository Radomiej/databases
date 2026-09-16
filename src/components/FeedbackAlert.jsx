function FeedbackAlert({ feedback }) {
  if (!feedback) return null;

  const tone = feedback.type === 'success' ? 'success' : feedback.type === 'warning' ? 'warning' : 'info';
  const icon = feedback.type === 'success' ? 'bi-check-circle-fill' : feedback.type === 'warning' ? 'bi-lightbulb-fill' : 'bi-info-circle-fill';

  return (
    <div className={`feedback-alert feedback-${tone}`} role="status">
      <i className={`bi ${icon}`} aria-hidden="true" />
      <div>
        <strong>{feedback.title}</strong>
        <p>{feedback.message}</p>
        {feedback.details && <small>{feedback.details}</small>}
      </div>
    </div>
  );
}

export default FeedbackAlert;
