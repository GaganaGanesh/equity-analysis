export const fetchEdgarMDA = async (ticker) => {
  try {
    const res = await fetch(`/api/edgar?ticker=${ticker}`);
    const data = await res.json();
    return data;
  } catch (err) {
    return { text: null, error: err.message };
  }
};
