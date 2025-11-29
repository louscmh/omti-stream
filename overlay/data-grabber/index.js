// SOCKET /////////////////////////////////////////////////////////////////
console.log(location.host);
let socket = new ReconnectingWebSocket("ws://localhost:24050/ws");
socket.onopen = () => {
    console.log("Successfully Connected");
};
socket.onclose = event => {
    console.log("Socket Closed Connection: ", event);
    socket.send("Client Closed!");
};
socket.onerror = error => {
    console.log("Socket Error: ", error);
};

let fileAsset = document.getElementById("file");
let mapperAsset = document.getElementById("mapper");
let difficultyAsset = document.getElementById("difficulty");
let sourceAsset = document.getElementById("source");
let sourceAssetBG = document.getElementById("sourceBG");
let grabBeatmap = document.getElementById("grabBeatmap");
let downloadDataset = document.getElementById("downloadDataset");
let beatmapid = document.getElementById("id");
let data;
let offlineSet = new Set();

// Add a picks list (order-sensitive). Update this array to the desired picks.
// Example: let picksList = ["NM1","NM2","NM3"];
// Optionally, if your HTML contains an input/textarea with id="picks", you can
// provide a comma-separated list there and it will override the array on change.
let picksList = ["NM1","NM2","NM3","NM4","NM5","NM6","HD1","HD2","HD3","HR1","HR2",
  "HR3","DT1","DT2","DT3","DT4","FM1","FM2","FM3","TB"];
const picksInput = document.getElementById("picks");
if (picksInput) {
    picksInput.addEventListener('change', () => {
        picksList = picksInput.value.split(',').map(s => s.trim()).filter(Boolean);
        console.log('Picks list set to:', picksList);
    });
}

// CONTROL PANELS //////////
let savedBeatmaps = [];
const savedBeatmapsList = document.getElementById("savedBeatmapsList");

grabBeatmap.addEventListener("click", async function (event) {
    if (data?.menu?.bm?.path?.file) {
        const beatmapFile = data.menu.bm.path.file;
        savedBeatmaps.push(beatmapFile);

        // Add to visible list
        const listItem = document.createElement("li");
        listItem.textContent = beatmapFile;
        savedBeatmapsList.appendChild(listItem);

        // Add to offline set for download
        offlineSet.add(data);
        console.log("Saved Beatmaps:", savedBeatmaps);
    }
})
downloadDataset.addEventListener("click", async function (event) {
    // Convert the Set to an array
    const setArray = Array.from(offlineSet);

    // Convert the array to JSON string
    const jsonString = JSON.stringify(setArray, null, 2);

    // Create a blob object with JSON data
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Create a temporary anchor element for downloading
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'offline_dataset.json';

    // Trigger the download by simulating a click
    document.body.appendChild(a);
    a.click();

    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
})
copyJSON.addEventListener("click", async function () {
    // Convert Set to Array
    const setArray = Array.from(offlineSet);
  
    // Format into new structure and assign pick by the capture order (index)
    const formatted = setArray.map((item, idx) => {
      const beatmapId = item.menu.bm.id !== 0
        ? item.menu.bm.id
        : item.menu.bm.path.file;
  
      return {
        beatmapId: beatmapId,
        pick: picksList[idx] || "", // assign pick based on order; fallback to empty string
        originalSR: item.menu.bm.stats.fullSR,
        modSR: null,
        customSong: false,
        collab: "",
        mappers: "",
        ezMultiplier : ""
      };
    });
  
    // Convert to JSON string
    const jsonString = JSON.stringify(formatted, null, 2);
  
    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(jsonString);
      alert("Dataset copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
      alert("Failed to copy to clipboard.");
    }
  });
  
let tempFile;
let tempID;

socket.onmessage = async event => {
    data = JSON.parse(event.data);

    if (tempFile != data.menu.bm.path.file) {
        tempFile = data.menu.bm.path.file;
        tempID = data.menu.bm.id;
        fileAsset.innerHTML = data.menu.bm.path.file;
        console.log(data.menu.bm.path.file);
        mapperAsset.innerHTML = data.menu.bm.metadata.mapper;
        beatmapid.innerHTML = tempID;
        difficultyAsset.innerHTML = data.menu.bm.metadata.difficulty;
        let bgSource = `http://127.0.0.1:24050/Songs/${data.menu.bm.path.full}?a=${Math.random(10000)}`;
        console.log(bgSource);
        sourceAsset.innerHTML = decodeHtmlEntities(bgSource);
        sourceAssetBG.setAttribute('src', decodeHtmlEntities(bgSource));
    }
}

function copyIDToClipboard() {
    navigator.clipboard.writeText(tempID);
}

function copyToClipboard() {
    navigator.clipboard.writeText(tempFile);
}

function decodeHtmlEntities(text) {
    let parser = new DOMParser();
    let doc = parser.parseFromString(text, "text/html");
    return doc.documentElement.textContent;
}