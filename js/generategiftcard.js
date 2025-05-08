
const form = document.getElementById("redirectForm");
const flyer1 = document.getElementById("flyer1");
const flyerQRCode = document.getElementById("flyerQRCode");
const flyerBackground = flyer1.querySelector(".flyer-img");
const countdownMsg = document.getElementById("countdownMsg");
const downloadBtn = document.getElementById("downloadBtn");
const downloadNote = document.getElementById("downloadNote");

function formatCardNumber(cardNumber) {
    return cardNumber.replace(/\s+/g, '').replace(/(.{4})/g, '$1-').replace(/-$/, '');
}

function generateQRCode(qrData) {
    const encodedData = encodeURIComponent(qrData);
    const qrUrl = `https://quickchart.io/qr?text=${encodedData}&size=1000&margin=0&ecLevel=H`;

    document.getElementById("clearBtn").style.display = "inline-block";

    localStorage.setItem("savedQRData", qrData);
    form.style.display = "none";

    const cardOnly = qrData.split("@")[0];
    const formattedCard = formatCardNumber(cardOnly);

    const codeOverlay = flyer1.querySelector(".code-overlay");
    codeOverlay.textContent = formattedCard;
    codeOverlay.style.display = "block";

    flyerQRCode.style.display = "none";

    flyerQRCode.onload = function () {
        flyerQRCode.style.display = "block";
        flyer1.style.display = "block";

        const alreadyDownloaded = localStorage.getItem("hasDownloadedQR");
        if (!alreadyDownloaded) {
            startCountdown();
        } else {
            // QR downloaded already: never show download button again
            downloadBtn.style.display = "none";
            downloadNote.style.display = "none";
            countdownMsg.style.display = "none";
        }
    };

    flyerQRCode.src = qrUrl;

    if (flyerQRCode.complete) {
        flyerQRCode.onload();
    }
}

function startCountdown() {
    let seconds = 60; // ⏱ Change time here
    countdownMsg.style.display = "block";
    countdownMsg.textContent = `Preparing download... ${seconds} seconds`;

    const countdown = setInterval(() => {
        seconds--;
        if (seconds > 0) {
            countdownMsg.textContent = `Preparing download... ${seconds} seconds`;
        } else {
            clearInterval(countdown);
            countdownMsg.style.display = "none";
            downloadBtn.style.display = "block";
            downloadNote.style.display = "block";
        }
    }, 1000);
}

window.addEventListener('DOMContentLoaded', () => {
    const savedQR = localStorage.getItem("savedQRData");
    const hasDownloaded = localStorage.getItem("hasDownloadedQR");

    if (savedQR) {
        generateQRCode(savedQR);

        // If already downloaded, keep flyer visible but no download button
        if (hasDownloaded) {
            downloadBtn.style.display = "none";
            downloadNote.style.display = "none";
            countdownMsg.style.display = "none";
        }
    } else {
        form.style.display = "block";
        flyer1.style.display = "none";
    }
});

downloadBtn.addEventListener("click", function () {
    if (flyerQRCode.complete) {
        captureFlyer();
    } else {
        flyerQRCode.onload = captureFlyer;
    }

    // Only allow download once
    localStorage.setItem("hasDownloadedQR", "true");
    downloadBtn.style.display = "none";
    downloadNote.style.display = "none";
});

function captureFlyer() {
    const flyerWrapper = flyer1.querySelector(".flyer-wrapper");

    html2canvas(flyerWrapper, {
        scale: 2,
        useCORS: true
    }).then(canvas => {
        const link = document.createElement("a");
        link.download = "card-with-qr.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
    });
}

form.addEventListener("submit", function (event) {
    event.preventDefault();

    const code = document.getElementById("code").value.replace(/\s+/g, '');
    const pin = document.getElementById("pin").value.replace(/\s+/g, '');

    if (code && pin) {
        const qrData = `${code}@${pin}`;
        generateQRCode(qrData);

        // Reset download status when new QR is submitted
        localStorage.removeItem("hasDownloadedQR");
    }
});

function downloadFlyer(flyerId) {
    const flyer = document.getElementById(flyerId);
    html2canvas(flyer, { useCORS: true, scale: 3 }).then(canvas => {
        const link = document.createElement("a");
        link.download = `${flyerId}-flyer.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    });
}

document.getElementById("clearBtn").addEventListener("click", function () {
    // Clear relevant localStorage
    localStorage.removeItem("hasDownloadedQR");
    localStorage.removeItem("savedQRData");

    // Stop any active countdown
    if (typeof countdownInterval !== "undefined") {
        clearInterval(countdownInterval);
    }

    // Reset input fields
    document.getElementById("code").value = "";
    document.getElementById("pin").value = "";

    // Hide flyer, show form again
    flyer1.style.display = "none";
    form.style.display = "block";

    // Clear QR container if it exists
    const qrContainer = document.getElementById("qr-container");
    if (qrContainer) qrContainer.innerHTML = "";

    // Fully reset countdown and download UI
    countdownMsg.textContent = "";
    countdownMsg.style.display = "none";

    downloadBtn.style.display = "none";
    downloadNote.style.display = "none";

    // Hide the Clear button itself again
    this.style.display = "none";
});
	
