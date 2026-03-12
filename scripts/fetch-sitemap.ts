async function fetchSitemap() {
    try {
        const response = await fetch('https://www.privatehealth.co.uk/sitemap.xml');
        const text = await response.text();
        console.log("Response text:");
        console.log(text.substring(0, 500));
    } catch(e) {
        console.error(e);
    }
}
fetchSitemap();
