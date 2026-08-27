export const updatePaymentStatus = async (docNo: string, remarks: string): Promise<boolean> => {
  try {
    // 1. Search for the document ID by doc_no
    const searchUrl = `http://localhost:5000/api/approvals?search=${encodeURIComponent(docNo)}`;
    const searchRes = await fetch(searchUrl);
    
    if (!searchRes.ok) {
      console.error(`Search for payment document ${docNo} failed with status: ${searchRes.status}`);
      return false;
    }

    const searchData = (await searchRes.json()) as any;
    if (!searchData.data || searchData.data.length === 0) {
      console.error(`Could not find payment document ${docNo} to update.`);
      return false;
    }

    // Usually the first result matching exactly
    const doc = searchData.data.find((d: any) => d.doc_no === docNo) || searchData.data[0];
    const docId = doc.id;

    // 2. Update the document by its integer ID
    const updateUrl = `http://localhost:5000/api/approvals/${docId}`;
    const updateRes = await fetch(updateUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 1, remark: remarks })
    });

    if (updateRes.ok) {
      console.log(`Successfully updated payment document ${docNo} (ID: ${docId}) to 'close job'.`);
      return true;
    } else {
      console.error(`Failed to update payment document ${docNo} (ID: ${docId}). Status: ${updateRes.status}`);
      return false;
    }
  } catch (err) {
    console.error(`Error updating payment document ${docNo}:`, err);
    return false;
  }
};
