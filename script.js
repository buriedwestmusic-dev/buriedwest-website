document.getElementById('year').textContent = new Date().getFullYear();

const bookingSection = document.querySelector('#booking');
const bookingEmail = bookingSection?.dataset.email.trim();

if (bookingEmail) {
  bookingSection.querySelector('.booking-status').hidden = true;
  bookingSection.querySelectorAll('.booking-email').forEach(button => {
    button.disabled = false;
    button.addEventListener('click', () => {
      const subject = encodeURIComponent(button.dataset.subject);
      const body = encodeURIComponent(button.dataset.body || '');
      window.location.href = `mailto:${bookingEmail}?subject=${subject}&body=${body}`;
    });
  });
}
