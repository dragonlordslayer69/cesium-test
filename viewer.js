const totalSeconds = 60 * 60 * 1.5;
const timestepInSeconds = 240;
const start = Cesium.JulianDate.fromDate(new Date());
const stop = Cesium.JulianDate.addSeconds(start, totalSeconds, new Cesium.JulianDate());

async function getData() {
    let satelliteArr = [];
    const res = await fetch('https://us-central1-stars-5145f.cloudfunctions.net/app/catalog');
    let orbitals = await res.text();
    console.log(orbitals);

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

async function loadViewer() {
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

function addToViewer(satrec, viewer) {
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
        point: { pixelSize: 2, color: Cesium.Color.RED }
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

async function propogate() {
    const satArr = await getData();

    let viewer = await loadViewer();

    for (let i = 0; i < satArr.length; i++) {
        addToViewer(satArr[i], viewer);
    }
}