function extractAndSpellCheckText() {
    const imageCanvas = document.getElementById("imageCanvas");
    const extractedTextElement = document.getElementById("extractedText");

    if (imageCanvas) {
        extractedTextElement.textContent = "Extracting text and checking spelling. Please wait...";

        // Use Tesseract.js to recognize text from the canvas
        Tesseract.recognize(imageCanvas, 'eng', {
            logger: (m) => console.log(m)
        })
        .then(({ data: { text, words } }) => {
            extractedTextElement.textContent = text || "No text found in the image.";

            if (text && dictionary) {
                const ctx = imageCanvas.getContext("2d");
                ctx.font = "16px Arial";
                ctx.fillStyle = "red";
                ctx.textBaseline = "top";

                let correctedText = text;

                // Split text into words and punctuation, e.g., ["Hello", ",", "world", "!"]
                const tokens = text.match(/\b\w+\b|[.,!?;:]/g);

                // Loop through each token and spell-check
                tokens.forEach((token) => {
                    // Check only word tokens for spelling errors
                    if (/\b\w+\b/.test(token)) {
                        const isCorrect = dictionary.check(token);

                        if (!isCorrect) {
                            const suggestions = dictionary.suggest(token);
                            const correctedWord = suggestions[0] || token;

                            // Replace word in correctedText while preserving punctuation
                            correctedText = correctedText.replace(token, correctedWord);

                            // Find the word's bounding box in Tesseract's data
                            const wordData = words.find((word) => word.text === token);
                            if (wordData) {
                                const bbox = wordData.bbox;
                                if (bbox) {
                                    // Draw the bounding box around the incorrect word
                                    ctx.strokeStyle = "red";
                                    ctx.lineWidth = 2;
                                    ctx.strokeRect(bbox.x0, bbox.y0, bbox.x1 - bbox.x0, bbox.y1 - bbox.y0);

                                    // Display the corrected word above the bounding box
                                    ctx.fillText(correctedWord, bbox.x0, bbox.y0 - 20);
                                }
                            }
                        }
                    }
                });

                // Display the corrected text in the text element
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
