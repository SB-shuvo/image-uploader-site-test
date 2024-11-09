// Initialize Typo.js dictionary
let dictionary;
fetch('en_US.dic').then((response) => response.text()).then((dicData) => {
    fetch('en_US.aff').then((response) => response.text()).then((affData) => {
        dictionary = new Typo("en_US", affData, dicData, { platform: "any" });
    });
});

function displayImage() {
    const imageInput = document.getElementById("imageInput");
    const imageCanvas = document.getElementById("imageCanvas");
    const ctx = imageCanvas.getContext("2d");

    if (imageInput.files && imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                imageCanvas.width = img.width;
                imageCanvas.height = img.height;
                ctx.drawImage(img, 0, 0);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(imageInput.files[0]);
    }
}

function extractAndCheckText() {
    const imageCanvas = document.getElementById("imageCanvas");
    const extractedTextElement = document.getElementById("extractedText");

    if (imageCanvas) {
        extractedTextElement.textContent = "Extracting text and checking spelling, please wait...";

        // Perform OCR on the canvas image
        Tesseract.recognize(imageCanvas, 'eng', { logger: (m) => console.log(m) })
        .then(({ data: { text, words } }) => {
            extractedTextElement.textContent = text || "No text found in the image.";

            if (text && dictionary) {
                const ctx = imageCanvas.getContext("2d");
                ctx.font = "16px Arial";
                ctx.fillStyle = "red";
                ctx.textBaseline = "top";

                // Loop through each recognized word
                words.forEach((word) => {
                    const wordText = word.text;
                    const isCorrect = dictionary.check(wordText);
                    
                    if (!isCorrect) {
                        // Get suggested correction for the misspelled word
                        const suggestions = dictionary.suggest(wordText);
                        const correctedText = suggestions[0] || wordText;

                        // Mark the incorrect word and display the correct word beside it
                        const bbox = word.bbox;
                        ctx.fillText(correctedText, bbox.x0, bbox.y0 - 20); // Display corrected word
                        ctx.strokeStyle = "red";
                        ctx.lineWidth = 2;
                        ctx.strokeRect(bbox.x0, bbox.y0, bbox.x1 - bbox.x0, bbox.y1 - bbox.y0); // Highlight incorrect word
                    }
                });
            }
        })
        .catch((error) => {
            extractedTextElement.textContent = "Error processing image: " + error.message;
        });
    } else {
        extractedTextElement.textContent = "Please upload an image first.";
    }
}
