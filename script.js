// Initialize Typo.js dictionary for spell-checking
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

function extractAndSpellCheckText() {
    const imageCanvas = document.getElementById("imageCanvas");
    const extractedTextElement = document.getElementById("extractedText");

    if (imageCanvas) {
        extractedTextElement.textContent = "Extracting text and checking spelling. Please wait...";

        Tesseract.recognize(imageCanvas, 'eng', { logger: (m) => console.log(m) })
        .then(({ data: { text, words } }) => {
            extractedTextElement.textContent = text || "No text found in the image.";

            if (text && dictionary) {
                const ctx = imageCanvas.getContext("2d");
                ctx.font = "16px Arial";
                ctx.fillStyle = "red";
                ctx.textBaseline = "top";

                let correctedText = text;

                // Split text into words and punctuation tokens
                const tokens = text.match(/\b\w+\b|[.,!?;:]/g);

                // Loop through each token
                tokens.forEach((token) => {
                    // Only check spelling for words (ignore punctuation)
                    if (/\b\w+\b/.test(token)) {
                        const isCorrect = dictionary.check(token);
                        
                        if (!isCorrect) {
                            const suggestions = dictionary.suggest(token);
                            const correctedWord = suggestions[0] || token;

                            // Replace the word in the correctedText with the corrected version
                            correctedText = correctedText.replace(token, correctedWord);

                            // Locate and highlight the word on canvas
                            const wordData = words.find((word) => word.text === token);
                            if (wordData) {
                                const bbox = wordData.bbox;
                                ctx.fillText(correctedWord, bbox.x0, bbox.y0 - 20); // Display corrected word
                                ctx.strokeStyle = "red";
                                ctx.lineWidth = 2;
                                ctx.strokeRect(bbox.x0, bbox.y0, bbox.x1 - bbox.x0, bbox.y1 - bbox.y0); // Highlight incorrect word
                            }
                        }
                    }
                });

                // Display corrected text
                extractedTextElement.textContent = correctedText;
            }
        })
        .catch((error) => {
            extractedTextElement.textContent = "Error processing image: " + error.message;
        });
    } else {
        extractedTextElement.textContent = "Please upload an image first.";
    }
}
