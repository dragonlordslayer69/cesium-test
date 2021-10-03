const totalSeconds = 60 * 60 * 3;
const timestepInSeconds = 300;
const start = Cesium.JulianDate.fromDate(new Date());
const stop = Cesium.JulianDate.addSeconds(start, totalSeconds, new Cesium.JulianDate());
const startTime = Cesium.JulianDate.addSeconds(start, -totalSeconds, new Cesium.JulianDate());
const endTime = Cesium.JulianDate.addSeconds(start, totalSeconds - 600, new Cesium.JulianDate());
let entityArr = [];

async function getData() {
    let satelliteArr = [];
    const res = await fetch('https://us-central1-stars-5145f.cloudfunctions.net/app/catalog2');
    let orbitalsArr = await res.json();

    let length = orbitalsArr.length;

    for (let i = 0; i < length - 1; i += 3) {
        const satrec = satellite.twoline2satrec(
            orbitalsArr[i].TLE_LINE1,
            orbitalsArr[i].TLE_LINE2
        );
        satelliteArr.push(satrec)
    }
    return {
        satArr: satelliteArr,
        orbArr: orbitalsArr
    };
}

async function loadViewer(satArr) {
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
    viewer.scene.globe.enableLighting = true;

    let latestEntity;

    viewer.selectedEntityChanged.addEventListener((entity) => {
        if (entity) {
            console.log(entity);
            if (latestEntity && latestEntity != entity) {
                latestEntity.label = undefined;
                latestEntity.polyline = undefined;
                latestEntity = entity;
            }
            latestEntity = entity;
            entity.label = {
                    text: `${entity.name}\nID: ${entity.id}\n`,
                    font: "12px Helvetica",
                    fillColor: Cesium.Color.WHITE,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    showBackground: true,
                }
                // let line = drawOrbit(satArr, entity.index, entity); //dragonlordslayer please find out how to get index of entity in satArr

        } else {
            latestEntity.label = undefined;
            latestEntity.polyline = undefined;
        }

    });

    return viewer;
}

function loadTimeline(timeline) {
    timeline.zoomTo(startTime, endTime)
    return timeline;
}

function loadPolyLines() {
    const polylines = new Cesium.PolylineCollection({ show: true });
    return polylines;
}

function addToViewer(satrec, viewer, orbArr, i) {
    let positionsOverTime = new Cesium.SampledPositionProperty();
    let satelliteEntity = {};

    for (let i = -totalSeconds; i < totalSeconds; i += timestepInSeconds) {
        const time = Cesium.JulianDate.addSeconds(start, i, new Cesium.JulianDate());
        const jsDate = Cesium.JulianDate.toDate(time);

        const positionAndVelocity = satellite.propagate(satrec, jsDate);
        if (Array.isArray(positionAndVelocity)) {
            break;
        }
        satelliteEntity.velocity = positionAndVelocity.velocity;
        const gmst = satellite.gstime(jsDate);
        // console.log(positionAndVelocity.position);
        const p = satellite.eciToGeodetic(positionAndVelocity.position, gmst);

        const position = Cesium.Cartesian3.fromRadians(p.longitude, p.latitude, p.height * 1000);
        positionsOverTime.addSample(time, position);
    }
    entityArr.push(positionsOverTime)

    let orbObj = orbArr[i];

    satelliteEntity.position = positionsOverTime;
    if (orbObj.OBJECT_TYPE == 'DEBRIS') {
        satelliteEntity.point = { pixelSize: 2, color: Cesium.Color.RED };
    } else if (orbObj.OBJECT_TYPE == 'PAYLOAD') {
        satelliteEntity.point = { pixelSize: 2, color: Cesium.Color.BLUE };
    } else {
        satelliteEntity.point = { pixelSize: 2, color: Cesium.Color.WHITE };
    }
    satelliteEntity.name = orbObj.OBJECT_NAME;
    satelliteEntity.index = i;
    satelliteEntity.id = orbObj.NORAD_CAT_ID;
    satelliteEntity.period = orbObj.PERIOD;
    satelliteEntity.inclination = orbObj.INCLIINATION;
    satelliteEntity.eccentricity = orbObj.ECCENTRICITY;
    satelliteEntity.meanMotion = orbObj.MEAN_MOTION;
    satelliteEntity.semiMajorAxis = orbObj.SEMIMAJOR_AXIS;

    const satellitePoint = viewer.entities.add(satelliteEntity);
    return satellitePoint;
}

function drawOrbit(satArr, index, entity) {
    let meanMotion = satArr[index]['mo'];
    let period = 60 * 2 * Math.PI / meanMotion;
    let positionArrSampled = [];
    let positionArr = [];

    for (let i = 0; i < period * 1000; i += 600) {
        const time = Cesium.JulianDate.addSeconds(start, i, new Cesium.JulianDate());
        const jsDate = Cesium.JulianDate.toDate(time);
        let positionsOverTime = satellite.propagate(satArr[index], jsDate);

        positionArrSampled.push(positionsOverTime.position)

    }

    for (let i = 0; i < positionArrSampled.length; i++) {
        console.log(positionArrSampled[i]);
        let cart = new Cesium.Cartesian3(positionArrSampled[i]['x'] * 1000, positionArrSampled[i]['y'] * 1000, positionArrSampled[i]['z'] * 1000)
        positionArr.push(cart);
    }

    console.log(positionArr);

    return entity.polyline = {
        positions: positionArr,
        width: 1,
        material: Cesium.Color.RED,
    }
}

async function propogate() {
    const { satArr, orbArr } = await getData();

    let viewer = await loadViewer(satArr);

    let polylines = loadPolyLines();

    let timeline = await loadTimeline(viewer.timeline);

    for (let i = 0; i < satArr.length; i++) {
        addToViewer(satArr[i], viewer, orbArr, i);
    }

    return true;
}