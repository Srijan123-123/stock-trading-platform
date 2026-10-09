import React from "react";

function OpenAccount() {
  return (
    <div className="container p-5 mb-5">
      <div className="row text-center">
        <h1 className="mt-5 mb-2">Open a Zerodha account</h1>
        <p className="mt-3 mb-3">
          Simple and intuitive apps · ₹0 for investments · ₹20 for intraday and
          F&O trades.
        </p>
        <button
          className="p-3 btn btn-primary fs-5 mb-5 mt-2"
          style={{ width: "20%", margin: "0 auto" }}
        >
          Sign up Now
        </button>
      </div>
    </div>
  );
}

export default OpenAccount;
