
async function main() {
    const email = "chancellor@ichancetek.com";
    const url = `http://localhost:3000/api/debug/find-user?email=${encodeURIComponent(email)}`;
    console.log("Fetching:", url);
    try {
        const res = await fetch(url);
        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Body:", text);
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}
main();
