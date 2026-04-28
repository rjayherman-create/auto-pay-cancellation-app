(function () {
  const BRAND = "AutoPay Cancel";
  const STORAGE_KEY = "disclaimerAccepted_v1";

  const style = document.createElement("style");
  style.innerHTML = `
    .dc-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      background: #111;
      color: #fff;
      padding: 12px 16px;
      font-size: 13px;
      z-index: 9999;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }
    .dc-bar button {
      background: #4CAF50;
      border: none;
      padding: 6px 12px;
      color: #fff;
      cursor: pointer;
      border-radius: 4px;
    }
    .dc-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.7);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    }
    .dc-box {
      background: #fff;
      padding: 20px;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      border-radius: 8px;
    }
    .dc-box h2 {
      margin-top: 0;
    }
    .dc-actions {
      margin-top: 15px;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    .dc-actions button {
      padding: 8px 14px;
      cursor: pointer;
      border: none;
      border-radius: 4px;
    }
    .accept-btn { background: #4CAF50; color: #fff; }
    .decline-btn { background: #ccc; }
  `;
  document.head.appendChild(style);

  function createBar() {
    if (localStorage.getItem(STORAGE_KEY)) return;

    const bar = document.createElement("div");
    bar.className = "dc-bar";
    bar.innerHTML = `
      <span>This tool generates cancellation letters. You remain responsible for sending and results.</span>
      <button id="dc-open">View Details</button>
    `;
    document.body.appendChild(bar);

    document.getElementById("dc-open").onclick = openModal;
  }

  function createModal() {
    const modal = document.createElement("div");
    modal.className = "dc-modal";
    modal.innerHTML = `
      <div class="dc-box">
        <h2>Legal Disclaimer</h2>

        <p>This application provides tools to generate cancellation requests for subscriptions and recurring payments.</p>

        <p><strong>We are not a law firm and do not provide legal advice.</strong></p>

        <ul>
          <li>You are responsible for reviewing and sending documents</li>
          <li>We do not guarantee cancellations</li>
          <li>We do not contact companies on your behalf</li>
          <li>No attorney-client or financial relationship is created</li>
        </ul>

        <h3>Financial Data</h3>
        <p>If you connect accounts, data is provided via secure third-party services (e.g., Plaid).</p>
        <ul>
          <li>We do NOT store banking credentials</li>
          <li>We do NOT cancel payments for you</li>
        </ul>

        <h3>Payments</h3>
        <ul>
          <li>Fees are for document generation tools only</li>
          <li>No guarantee of results</li>
          <li>Payments are non-refundable after use</li>
        </ul>

        <div class="dc-actions">
          <button class="decline-btn" id="dc-decline">Close</button>
          <button class="accept-btn" id="dc-accept">I Understand</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("dc-accept").onclick = () => {
      localStorage.setItem(STORAGE_KEY, "true");
      modal.style.display = "none";
      const bar = document.querySelector(".dc-bar");
      if (bar) bar.remove();
    };

    document.getElementById("dc-decline").onclick = () => {
      modal.style.display = "none";
    };

    return modal;
  }

  let modal;

  function openModal() {
    if (!modal) modal = createModal();
    modal.style.display = "flex";
  }

  function interceptActions() {
    document.addEventListener("click", function (e) {
      const target = e.target;

      if (target.matches(".generate-letter, #generateLetter")) {
        if (!localStorage.getItem(STORAGE_KEY)) {
          e.preventDefault();
          openModal();
        }
      }

      if (target.matches(".connect-bank, #connectPlaid")) {
        alert("We do NOT access or control your bank account. Data is read-only via secure providers.");
      }

      if (target.matches(".checkout, #checkoutBtn")) {
        alert("You are purchasing access to document generation tools. Results are not guaranteed.");
      }
    });
  }

  window.addEventListener("load", () => {
    createBar();
    modal = createModal();
    interceptActions();
  });
})();
