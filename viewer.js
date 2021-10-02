const totalSeconds = 60;
const timestepInSeconds = 10;
const start = Cesium.JulianDate.fromDate(new Date());
const stop = Cesium.JulianDate.addSeconds(start, totalSeconds, new Cesium.JulianDate());

function getData() {
    let satelliteArr = [];
    let orbitals = "";
    let rawFile = new XMLHttpRequest();
    rawFile.open("GET", "./catalog.txt", false);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4) {
            if (rawFile.status === 200 || rawFile.status == 0) {
                orbitals = rawFile.responseText.toString();
            }
        }
    }
    rawFile.send(null)

    let orbitalsArr = orbitals.split('\n'),
        length = orbitalsArr.length;

    for (let i = 0; i < length - 1; i += 3) {
        const satrec = satellite.twoline2satrec(
            orbitalsArr[i + 1].trim(),
            orbitalsArr[i + 2].trim()
        );
        satelliteArr.push(satrec)
    }

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
        console.log(i);
    }

    const satellitePoint = viewer.entities.add({
        position: positionsOverTime,
        point: { pixelSize: 5, color: Cesium.Color.RED }
    });
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