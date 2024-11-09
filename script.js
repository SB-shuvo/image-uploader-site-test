function displayImage() {
    const imageInput = document.getElementById("imageInput");
    const displayedImage = document.getElementById("displayedImage");

    if (imageInput.files && imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            displayedImage.src = e.target.result;
            displayedImage.style.display = "block";
        };
        reader.readAsDataURL(imageInput.files[0]);
    }
}

function extractText() {
    const displayedImage = document.getElementById("displayedImage");
    const extractedTextElement = document.getElementById("extractedText");

    if (displayedImage.src) {
        // Clear any previous text
        extractedTextElement.textContent = "Extracting text, please wait...";

        // Use Tesseract.js to perform OCR on the image
        Tesseract.recognize(displayedImage.src, 'eng', {
            logger: (m) => console.log(m), // Logs progress
        }).then(({ data: { text } }) => {
            extractedTextElement.textContent = text || "No text found in the image.";
        }).catch((error) => {
            extractedTextElement.textContent = "Error extracting text: " + error.message;
        });
    } else {
        extractedTextElement.textContent = "Please upload an image first.";
    }
}
