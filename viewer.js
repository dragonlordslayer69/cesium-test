const totalSeconds = 60 * 60 * 24;
const timestepInSeconds = 10;
const start = Cesium.JulianDate.fromDate(new Date());
const stop = Cesium.JulianDate.addSeconds(start, totalSeconds, new Cesium.JulianDate());

function getData() {
    let satelliteArr = [];
    let allText = "a";
    let rawFile = new XMLHttpRequest();
    rawFile.open("GET", "./data.txt", false);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4) {
            if (rawFile.status === 200 || rawFile.status == 0) {
                allText = rawFile.responseText.toString();
            }
        }
    }
    rawFile.send(null)
    for (let i = 0; i < allText.split('\n').length - 1; i += 3) {
        const satrec = satellite.twoline2satrec(
            allText.split('\n')[i + 1].trim(),
            allText.split('\n')[i + 2].trim()
        );
        satelliteArr.push(satrec)
    }
    // console.log(satelliteArr);

    return satelliteArr;
}

function loadViewer() {
    const viewer = new Cesium.Viewer('cesiumContainer', {
        imageryProvider: new Cesium.TileMapServiceImageryProvider({
            url: Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII"),
        }),
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        navigationHelpButton: false,
        sceneModePicker: false
    });

    return viewer;
}

function addToViewer(satrec) {
    let positionsOverTime = new Cesium.SampledPositionProperty();

    for (let i = 0; i < totalSeconds; i += timestepInSeconds) {
        const time = Cesium.JulianDate.addSeconds(start, i, new Cesium.JulianDate());
        const jsDate = Cesium.JulianDate.toDate(time);

        const positionAndVelocity = satellite.propagate(satrec, jsDate);
        const gmst = satellite.gstime(jsDate);
        const p = satellite.eciToGeodetic(positionAndVelocity.position, gmst);

        const position = Cesium.Cartesian3.fromRadians(p.longitude, p.latitude, p.height * 1000);
        positionsOverTime.addSample(time, position);
    }

    const satellitePoint = viewer.entities.add({
        position: positionsOverTime,
        point: { pixelSize: 5, color: Cesium.Color.RED }
    });
    console.log(viewer.entities)
    return satellitePoint;
}

function drawOrbit(_twoLineElement) {
    orbitPointsDrawer.twoLineElement = _twoLineElement;
    orbitPolylineDrawer.twoLineElement = _twoLineElement;
}

function addOnClickSatelliteEvent(_satelliteElement) {
    _satelliteElement.onclick = function() {
        var tleIndex = parseInt(this.getAttribute("value"));
        drawOrbit(twoLineElements.slice(tleIndex, tleIndex + 3).join("\n"));
    };
}