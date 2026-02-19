document.addEventListener('DOMContentLoaded', () => {
    // Star Rating Logic
    const starContainers = document.querySelectorAll('.stars');

    starContainers.forEach(container => {
        const stars = container.querySelectorAll('i');
        const hiddenInput = container.querySelector('input[type="hidden"]');

        stars.forEach(star => {
            // Hover effects
            star.addEventListener('mouseenter', () => {
                const value = parseInt(star.getAttribute('data-value'));
                highlightStars(stars, value);
            });

            // Click handling
            star.addEventListener('click', () => {
                const value = parseInt(star.getAttribute('data-value'));
                hiddenInput.value = value;
                // Add 'selected' class to container to know a selection was made
                container.classList.add('has-selection');
                // Persist the highlight
                highlightStars(stars, value, true);
            });

            // Mouse leave - reset to selected value or 0
            container.addEventListener('mouseleave', () => {
                const currentValue = parseInt(hiddenInput.value);
                highlightStars(stars, currentValue, true);
            });
        });
    });

    function highlightStars(stars, value, isSelected = false) {
        stars.forEach(star => {
            const starValue = parseInt(star.getAttribute('data-value'));
            if (starValue <= value) {
                star.classList.remove('far');
                star.classList.add('fas'); // Solid star
                star.classList.add('active');
            } else {
                star.classList.remove('fas');
                star.classList.add('far'); // Empty star
                star.classList.remove('active');
            }
        });
    }

    // Form Submission Logic
    const form = document.getElementById('evaluationForm');
    const modal = document.getElementById('successModal');
    const closeModalBtn = document.getElementById('closeModalBtn');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Gather form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Add timestamp to data
        data.timestamp = new Date().toISOString();
        data.id = Date.now().toString(); // Simple ID

        // Simulate Sending Email
        simulateSendEmail(data);

        // Calculate Average Rating
        let totalScore = 0;
        let count = 0;
        const ratingFields = [
            'hotel-cleanliness', 'hotel-comfort', 'hotel-service',
            'internal-food', 'internal-service', 'internal-ambiance',
            'beach-food', 'beach-service', 'beach-ambiance'
        ];

        ratingFields.forEach(field => {
            const val = formData.get(field);
            if (val) {
                totalScore += parseInt(val);
                count++;
            }
        });

        const average = count > 0 ? (totalScore / count) : 0;
        console.log(`Average Rating: ${average.toFixed(2)}`);

        // Save to LocalStorage (Simulate Database)
        data.averageRating = average.toFixed(2); // Start saving average too
        saveToDatabase(data);

        // Log to console (Simulating backend)
        console.group('Avaliação Recebida');
        console.log('Dados do Formulário:', data);
        console.groupEnd();

        // Show Smart Modal
        if (average >= 4.5) {
            // Promoter
            const promoterModal = document.getElementById('successModalPromoter');
            if (promoterModal) promoterModal.style.display = 'flex';
        } else {
            // Neutral/Detractor
            const neutralModal = document.getElementById('successModalNeutral');
            if (neutralModal) neutralModal.style.display = 'flex';
        }

        // Reset form
        form.reset();

        // Reset stars visual state
        starContainers.forEach(container => {
            const stars = container.querySelectorAll('i');
            highlightStars(stars, 0);
            container.querySelector('input[type="hidden"]').value = 0;
            container.classList.remove('has-selection');
        });
    });

    // Simulate sending email to reserva@hotelsolar.tur.br
    function simulateSendEmail(data) {
        console.log(`%c[EMAIL SIMULATION] Sending to reserva@hotelsolar.tur.br:`, 'color: orange; font-weight: bold;');
        console.log('Subject: Nova Avaliação de Experiência');
        console.log('Body:', JSON.stringify(data, null, 2));
    }

    // Save to LocalStorage
    function saveToDatabase(data) {
        let evaluations = JSON.parse(localStorage.getItem('hotelSolarEvaluations')) || [];
        evaluations.push(data);
        localStorage.setItem('hotelSolarEvaluations', JSON.stringify(evaluations));
        console.log('%c[DATABASE] Evaluated saved to localStorage.', 'color: green; font-weight: bold;');
    }

    // Close Modal Logic
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });
    }

    // Close modal when clicking outside content
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
});

// Global function for new modals
function closeModalAndReload() {
    window.location.reload();
}
