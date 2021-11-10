var gravity = new b2Vec2(0, -9.82);
var world = new b2World(gravity);
var windowWidth = window.innerWidth;
var windowHeight = window.innerHeight;
var camera = new THREE.PerspectiveCamera(7, windowWidth / windowHeight, 1, 1000);

camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 100;
scene = new THREE.Scene();
camera.lookAt(scene.position);

var threeRenderer = new THREE.WebGLRenderer();
var renderer = new Renderer();
document.body.appendChild(threeRenderer.domElement);

threeRenderer.setClearColor(0xEEEEEE);
threeRenderer.setSize(windowWidth, windowHeight);
var timeStep = 1 / 60.0;
var velocityIterations = 8;
var positionIterations = 3;
test = {};
var projector = new THREE.Projector();
var planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
this.mouseJoint = null;
var that = this;
var g_groundBody = null;

var mousePos = null;

var lastMouseEvent = null;
function getMouseCoords(event) {
    var mouse = new THREE.Vector3();
    var clientX, clientY;
    if (!event.clientX && !event.touches.length && event.touches) {
        clientX = lastMouseEvent.touches[0].clientY;
        clientY = lastMouseEvent.touches[0].clientY;
    } else {
        clientX = event.clientX || event.touches[0].clientX;
        clientY = event.clientY || event.touches[0].clientY;
        lastMouseEvent = event;
    }
    mouse.x = (clientX / windowWidth) * 2 - 1;
    mouse.y = -(clientY / windowHeight) * 2 + 1;
    mouse.z = 0.5;

    projector.unprojectVector(mouse, camera);
    var dir = mouse.sub(camera.position).normalize();
    var distance = -camera.position.z / dir.z;
    var pos = camera.position.clone().add(dir.multiplyScalar(distance));
    var p = new b2Vec2(pos.x, pos.y);
    mousePos = p;
    return p;
}

var mouseDown = function (event) {
    var p = getMouseCoords(event);
    var aabb = new b2AABB;
    var d = new b2Vec2;

    d.Set(0.01, 0.01);
    b2Vec2.Sub(aabb.lowerBound, p, d);
    b2Vec2.Add(aabb.upperBound, p, d);

    var queryCallback = new QueryCallback(p);
    world.QueryAABB(queryCallback, aabb);

    if (queryCallback.fixture) {
        var body = queryCallback.fixture.body;
        var md = new b2MouseJointDef;
        md.bodyA = g_groundBody;
        md.bodyB = body;
        md.target = p;
        md.maxForce = 1000 * body.GetMass();
        that.mouseJoint = world.CreateJoint(md);
        body.SetAwake(true);
    }
    if (test.MouseDown !== undefined) {
        test.MouseDown(p);
    }

};
document.addEventListener('touchstart', mouseDown);
document.addEventListener('mousedown', mouseDown);

var mouseMove = function (event) {
    if (mouseJoint) {
        var p = getMouseCoords(event);
        mouseJoint.SetTarget(p);
    }
};
document.addEventListener('touchmove', mouseMove);
document.addEventListener('mousemove', mouseMove);

var mouseUp = function (event) {
    if (that.mouseJoint) {
        world.DestroyJoint(that.mouseJoint);
        that.mouseJoint = null;
    }
    if (test.MouseUp !== undefined) {
        test.MouseUp(getMouseCoords(event));
    }
};
document.addEventListener('touchend', mouseUp);
document.addEventListener('mouseup', mouseUp);

var keyDown = function (event) {
    if (event.key = ' ') {
        var particleGroupDef = new b2ParticleGroupDef();
        particleGroupDef.shape = box;
        particleGroupDef.color = new b2ParticleColor(0, 0, 255);
        particleGroupDef.positionData = (mousePos);
        particleGroupDef.shapeCount = 1;
        particleSystem.CreateParticleGroup(particleGroupDef);
    }
}

document.addEventListener('keydown', keyDown);

function render() {
    renderer.draw();
    renderer.currentVertex = 0;
    if (test.Step !== undefined) {
        test.Step();
    } else {
        step();
    }

    threeRenderer.render(scene, camera);
    requestAnimationFrame(render);
}

function step() {
    world.Step(timeStep, velocityIterations, positionIterations);
}

function setCamZ(val) {
    camera.position.z = val;
}

camera.position.y = 0;
camera.position.z = 100;

var bd = new b2BodyDef();
var ground = world.CreateBody(bd);
bd.type = b2_staticBody;
bd.allowSleep = false;
bd.position.Set(0, 0);
var body = world.CreateBody(bd);
g_groundBody = ground;

var b1 = new b2PolygonShape();
b1.SetAsBoxXYCenterAngle(0.05, 5, new b2Vec2(10, 0), 0);
body.CreateFixtureFromShape(b1, 5);

var b2 = new b2PolygonShape();
b2.SetAsBoxXYCenterAngle(0.05, 5, new b2Vec2(-10, 0), 0);
body.CreateFixtureFromShape(b2, 5);

var b3 = new b2PolygonShape();
b3.SetAsBoxXYCenterAngle(10, 0.05, new b2Vec2(0, 5), 0);
body.CreateFixtureFromShape(b3, 5);

var b4 = new b2PolygonShape();
b4.SetAsBoxXYCenterAngle(10, 0.05, new b2Vec2(0, -5), 0);
body.CreateFixtureFromShape(b4, 5);

// Start particle system
var psd = new b2ParticleSystemDef();
psd.radius = 0.025;
psd.dampingStrength = 0;
psd.maxCount = 10000000;

var particleSystem = world.CreateParticleSystem(psd);

var box = new b2PolygonShape();
box.SetAsBoxXYCenterAngle(0.9, 0.9, new b2Vec2(0, 1.0), 0);

var particleGroupDef = new b2ParticleGroupDef();
particleGroupDef.shape = box;
particleGroupDef.shapeCount = 1;
particleGroupDef.color = new b2ParticleColor(0, 0, 255);
var particleGroup = particleSystem.CreateParticleGroup(particleGroupDef);

var testingBodyDef = new b2BodyDef();
testingBodyDef.type = b2_dynamicBody;
testingBodyDef.position.Set(3, 0);
var tb = world.CreateBody(testingBodyDef);
tb.SetMassData(new b2MassData(100, new b2Vec2(0, 0), 0));
var tbFixture = new b2CircleShape
tbFixture.position.Set(0, 0);
tbFixture.radius = 0.4;
tb.CreateFixtureFromShape(tbFixture, 1);

world.SetGravity(new b2Vec2(0, -9.82));

render();