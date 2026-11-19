import { useEffect, useState } from "react";
import { useAuth } from "../auth.jsx";
import { api, errorText, money } from "../api.js";
import { Empty } from "../ui.jsx";
import { useNotice } from "../notice.jsx";

export default function Reports() {
  const { token } = useAuth();
  const { toast } = useNotice();
  const [report, setReport] = useState(null);

  useEffect(() => {
    api("/api/reports/today", { token })
      .then(setReport)
      .catch((err) => toast("bad", errorText(err)));
  }, [token]);

  return (
    <div className="stack narrow">
      <header className="page-head">
        <div>
          <p className="kicker">Tonight</p>
          <h1>Reports</h1>
          <p className="lede">Orders, revenue, and the dishes that moved today.</p>
        </div>
      </header>
      {!report && <p className="calm">Counting the book…</p>}
      {report && (
        <>
          <dl className="figures">
            <div>
              <dt>Orders</dt>
              <dd>{report.todayOrders}</dd>
            </div>
            <div>
              <dt>Revenue</dt>
              <dd>{money(report.todayRevenue)}</dd>
            </div>
          </dl>
          <section>
            <h2>By status</h2>
            {report.ordersByStatus.length === 0 && <Empty>No orders today.</Empty>}
            <ul className="plain">
              {report.ordersByStatus.map((row) => (
                <li key={row.status}>
                  <span>{row.status.toLowerCase()}</span>
                  <strong>{row.count}</strong>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2>Popular today</h2>
            {report.popularItems.length === 0 && <Empty>No dishes sold today yet.</Empty>}
            <ul className="plain">
              {report.popularItems.map((item) => (
                <li key={item.name}>
                  <span>{item.name}</span>
                  <strong>{item.quantity}</strong>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
