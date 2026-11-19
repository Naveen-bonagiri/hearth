import { createContext, useCallback, useContext, useMemo, useState } from "react";

const NoticeContext = createContext(null);

export function NoticeProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [ask, setAsk] = useState(null);

  const toast = useCallback((kind, text) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, kind, text }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  const confirm = useCallback((question) => new Promise((resolve) => {
    setAsk({ question, resolve });
  }), []);

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  function answer(yes) {
    ask?.resolve(yes);
    setAsk(null);
  }

  return (
    <NoticeContext.Provider value={value}>
      {children}
      <div className="toaster" aria-live="polite">
        {toasts.map((item) => (
          <p key={item.id} className={`toast ${item.kind}`}>{item.text}</p>
        ))}
      </div>
      {ask && (
        <div className="ask-back">
          <div className="ask" role="dialog" aria-modal="true">
            <p>{ask.question}</p>
            <div className="actions">
              <button type="button" className="primary" onClick={() => answer(true)}>Yes</button>
              <button type="button" className="ghost" onClick={() => answer(false)}>Not now</button>
            </div>
          </div>
        </div>
      )}
    </NoticeContext.Provider>
  );
}

export function useNotice() {
  const notice = useContext(NoticeContext);
  if (!notice) throw new Error("Notice is missing");
  return notice;
}
