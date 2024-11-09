function displayImage() {
    const imageInput = document.getElementById("imageInput");
    const imageContainer = document.getElementById("imageContainer");
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
