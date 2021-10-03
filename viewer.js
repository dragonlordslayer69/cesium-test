const totalSeconds = 60 * 60 * 3;
const timestepInSeconds = 300;
const start = Cesium.JulianDate.fromDate(new Date());
const stop = Cesium.JulianDate.addSeconds(start, totalSeconds, new Cesium.JulianDate());
const startTime = Cesium.JulianDate.addSeconds(start, -totalSeconds, new Cesium.JulianDate());
const endTime = Cesium.JulianDate.addSeconds(start, totalSeconds - 600, new Cesium.JulianDate());

async function getData() {
    let satelliteArr = [];
    const res = await fetch('https://us-central1-stars-5145f.cloudfunctions.net/app/catalog');
    let orbitals = await res.text();

    let orbitalsArr = orbitals.split('\n'),
        length = orbitalsArr.length;

    for (let i = 0; i < length - 1; i += 3) {
        const satrec = satellite.twoline2satrec(
            orbitalsArr[i + 1].trim(),
            orbitalsArr[i + 2].trim()
        );
        satelliteArr.push(satrec)
    }
    return {
        satArr: satelliteArr,
        orbArr: orbitalsArr
    };
}

async function loadViewer() {
    const clock = new Cesium.Clock({
        startTime: startTime,
        stopTime: endTime,
        currentTime: start,
        clockRange: Cesium.ClockRange.CLAMPED, // loop when we hit the end time
        canAnimate: true,
        shouldAnimate: true,
    });

    const clockViewModel = new Cesium.ClockViewModel(clock);

    const viewer = new Cesium.Viewer('cesiumContainer', {
        imageryProvider: new Cesium.TileMapServiceImageryProvider({
            url: Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII"),
        }),
        baseLayerPicker: false,
        geocoder: false,
        homeButton: true,
        infoBox: false,
        navigationHelpButton: true,
        sceneModePicker: false,
        clockViewModel
    });

    let latestEntity;

    viewer.selectedEntityChanged.addEventListener((entity) => {
        if (entity) {
            if (latestEntity && latestEntity != entity) {
                latestEntity.label = undefined;
                latestEntity = entity;
            }
            latestEntity = entity;
            entity.label = {
                text: `${entity.name}\n${entity.id}`,
                font: "12px Helvetica",
                fillColor: Cesium.Color.WHITE,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                showBackground: true,
                // horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                // pixelOffset: new Cesium.Cartesian2(0.0, -50),
                // pixelOffsetScaleByDistance: new Cesium.NearFarScalar(
                //     1.5e2,
                //     3.0,
                //     1.5e7,
                //     0.5
                // ),
            }
        } else {
            latestEntity.label = undefined;
        }

    });

    return viewer;
}

function loadTimeline(timeline) {
    timeline.zoomTo(startTime, endTime)
    return timeline;
}

function addToViewer(satrec, viewer, orbArr, i) {
    let positionsOverTime = new Cesium.SampledPositionProperty();
    let satelliteEntity = {};

    for (let i = -totalSeconds; i < totalSeconds; i += timestepInSeconds) {
        const time = Cesium.JulianDate.addSeconds(start, i, new Cesium.JulianDate());
        const jsDate = Cesium.JulianDate.toDate(time);

        const positionAndVelocity = satellite.propagate(satrec, jsDate);
        satelliteEntity.velocity = positionAndVelocity.velocity;
        const gmst = satellite.gstime(jsDate);
        const p = satellite.eciToGeodetic(positionAndVelocity.position, gmst);

        const position = Cesium.Cartesian3.fromRadians(p.longitude, p.latitude, p.height * 1000);
        positionsOverTime.addSample(time, position);
    }

    satelliteEntity.position = positionsOverTime;
    satelliteEntity.point = { pixelSize: 2, color: Cesium.Color.YELLOW };
    satelliteEntity.name = orbArr[i * 3].trim();
    satelliteEntity.id = satrec.satnum;

    const satellitePoint = viewer.entities.add(satelliteEntity);
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
    const { satArr, orbArr } = await getData();

    let viewer = await loadViewer();

    let timeline = await loadTimeline(viewer.timeline);

    for (let i = 0; i < satArr.length; i++) {
        addToViewer(satArr[i], viewer, orbArr, i);
    }

    return true;
}