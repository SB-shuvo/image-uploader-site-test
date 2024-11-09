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
        extractedTextElement.textContent = "Extracting text, checking spelling, and checking grammar. Please wait...";

        Tesseract.recognize(imageCanvas, 'eng', { logger: (m) => console.log(m) })
        .then(({ data: { text, words } }) => {
            extractedTextElement.textContent = text || "No text found in the image.";

            if (text && dictionary) {
                const ctx = imageCanvas.getContext("2d");
                ctx.font = "16px Arial";
                ctx.fillStyle = "red";
                ctx.textBaseline = "top";

                let correctedText = text;

                // Spell-check and correct each word
                words.forEach((word) => {
                    // Remove punctuation before spell-checking
                    const cleanWordText = word.text.replace(/[.,!?;:]$/, '');
                    const isCorrect = dictionary.check(cleanWordText);
                    
                    if (!isCorrect) {
                        const suggestions = dictionary.suggest(cleanWordText);
                        const correctedWord = suggestions[0] || cleanWordText;

                        // Replace the word in the original text while keeping original punctuation
                        correctedText = correctedText.replace(word.text, correctedWord + word.text.slice(cleanWordText.length));

                        // Highlight on canvas
                        const bbox = word.bbox;
                        ctx.fillText(correctedWord, bbox.x0, bbox.y0 - 20);
                        ctx.strokeStyle = "red";
                        ctx.lineWidth = 2;
                        ctx.strokeRect(bbox.x0, bbox.y0, bbox.x1 - bbox.x0, bbox.y1 - bbox.y0);
                    }
                });

                // After spell-checking, send corrected text for grammar check
                checkGrammar(correctedText);
            }
        })
        .catch((error) => {
            extractedTextElement.textContent = "Error processing image: " + error.message;
        });
    } else {
        extractedTextElement.textContent = "Please upload an image first.";
    }
}

// Function to check grammar using LanguageTool API
function checkGrammar(text) {
    fetch("https://api.languagetoolplus.com/v2/check", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Bearer ${LANGUAGE_TOOL_API_KEY}`
        },
        body: new URLSearchParams({
            text: text,
            language: "en-US"
        })
    })
    .then(response => response.json())
    .then(data => {
        const ctx = document.getElementById("imageCanvas").getContext("2d");

        // Loop through grammar matches and highlight each
        data.matches.forEach(match => {
            const errorText = text.substring(match.offset, match.offset + match.length);
            const correction = match.replacements[0]?.value || errorText;

            // Overlay the correction on canvas (positioning is estimated here)
            ctx.fillStyle = "blue";
            ctx.fillText(correction, 10, 10); // Positioning will need actual bounding box info for accuracy

            // Display grammar issue details in the text container
            const extractedTextElement = document.getElementById("extractedText");
            extractedTextElement.innerHTML += `<br>Grammar issue: ${errorText} → ${correction}`;
        });
    })
    .catch((error) => {
        console.error("Error with LanguageTool API:", error);
    });
}
