var gravity = new b2Vec2(0, -9.82);
var world = new b2World(gravity);
var windowWidth = window.innerWidth;
var windowHeight = window.innerHeight;
var camera = new THREE.PerspectiveCamera(7, windowWidth / windowHeight, 1, 1000);
var wallSize = 2;

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
var customWallMass = 100;
var currentFlag = 0;
var currentStrength = 1;
var turnDown = false;
var turnKey = 0;
var customWallState = b2_dynamicBody;
var holdingParticle = false;
var particleHolding = null;

var flags = [
    b2_waterParticle,
    b2_viscousParticle,
    b2_elasticParticle,
    b2_springParticle
]

var mousePos = null;
var oldMousePos = null;
var startMousePos = null;
var endMousePos = null;

var startSpacePos = null;
var endSpacePos = null;

window.addEventListener('contextmenu', function (ev) {
    ev.preventDefault();
    return false;
}, false);

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

var onWheel = function (event) {
    setCamZ(camera.position.z + -event.wheelDeltaY / 80);
}

document.body.addEventListener('wheel', onWheel);

var mouseDown = function (event) {
    var p = getMouseCoords(event);
    var aabb = new b2AABB;
    var d = new b2Vec2;

    d.Set(0.01, 0.01);
    b2Vec2.Sub(aabb.lowerBound, p, d);
    b2Vec2.Add(aabb.upperBound, p, d);

    var queryCallback = new QueryCallback(p);
    world.QueryAABB(queryCallback, aabb);
    if (event.which == 1) {
        if (queryCallback.fixture) {
            var body = queryCallback.fixture.body;
            var md = new b2MouseJointDef;
            md.bodyA = g_groundBody;
            md.bodyB = body;
            md.target = p;
            md.maxForce = 1000 * body.GetMass();
            that.mouseJoint = world.CreateJoint(md);
            body.SetAwake(true);
        } else {
            let particle = null;
            let positionBuffer = particleSystem.GetPositionBuffer();
            for (let i = 0; i < particleSystem.GetParticleCount(); i++) {
                if (Math.abs(positionBuffer[i * 2] - mousePos.x) + Math.abs(positionBuffer[i * 2 + 1] - mousePos.y) < 0.1) {
                    particle = i;
                    break;
                }
            }

            if (particle) {
                holdingParticle = true;
                particleHolding = particle;
            }
        }
    } else if (event.which == 3) {
        startMousePos = p;
    }
    if (test.MouseDown !== undefined) {
        test.MouseDown(p);
    }

};
document.addEventListener('touchstart', mouseDown);
document.addEventListener('mousedown', mouseDown);

var mouseMove = function (event) {
    var p = getMouseCoords(event);
    if (mouseJoint) {
        mouseJoint.SetTarget(p);
    }
};
document.addEventListener('touchmove', mouseMove);
document.addEventListener('mousemove', mouseMove);

var mouseUp = function (event) {
    holdingParticle = false;
    particle = null;

    if (that.mouseJoint) {
        world.DestroyJoint(that.mouseJoint);
        that.mouseJoint = null;
    }
    if (startMousePos) {
        endMousePos = getMouseCoords(event);
        if (Math.abs(endMousePos.x - startMousePos.x) < 0.1 || Math.abs(endMousePos.y - startMousePos.y) < 0.1) {
            return;
        }
        var b = new b2BodyDef();
        b.position.Set((endMousePos.x + startMousePos.x) / 2, (endMousePos.y + startMousePos.y) / 2);
        b.type = customWallState;
        var tb = world.CreateBody(b);
        var tbFixture = new b2PolygonShape();

        tbFixture.SetAsBoxXYCenterAngle(Math.abs(endMousePox.x - startMousePos.x), Math.abs(endMousePos.y - startMousePos.y));

        tb.CreateFixtureFromShape(tbFixture, customWallMass);
        startMousePos = null;
        endMousePos = null;
    }
};
document.addEventListener('touchend', mouseUp);
document.addEventListener('mouseup', mouseUp);

var keyDown = function (event) {
    if (event.key == ' ') {
        if (!startSpacePos) {
            startSpacePos = mousePos;
        }
    }

    if (event.key == 'x') {
        timeStep = timeStep * 60 * 2 / 60
    }

    if (event.key == 'z') {
        timeStep = timeStep * 60 / 2 / 60;
    }

    if (event.key == '[') {
        tb.SetMassData(new b2MassData(tb.GetMass() * 2, new b2Vec2(0, 0), 0));
    }

    if (event.key == ']') {
        tb.SetMassData(new b2MassData(tb.GetMass() / 2, new b2Vec2(0, 0), 0));
    }
    
    if (event.key == ',') {
        customWallMass = customWallMass / 1.5;
    }

    if (event.key == '.') {
        customWallMass = customWallMass * 1.5;
    }

    if (event.key == 'q') {
        currentFlag--;
        if (currentFlag == -1) {
            currentFlag = flags.length - 1;
        }
    }

    if (event.key == 'w') {
        currentFlag++;
        if (currentFlag == flags.length) {
            currentFlag = 0;
        }
    }
    
    if (event.key == 't') {
        currentStrength = currentStrength / 1.1;
    }

    if (event.key == 'y') {
        currentStrength = currentStrength * 1.1;
    }

    if (event.key == 'u') {
        turnDown = true;
        turnKey = 0;
    }

    if (event.key == 'i') {
        turnDown = true;
        turnKey = 1;
    }

    if (event.key == 'a') {
        if (customWallState == b2_dynamicBody) {
            customWallState = b2_kinematicBody;
            return;
        }
        if (customWallState == b2_kinematicBody) customWallState = b2_dynamicBody;
    }
}

function keyUp(event) {
    if (event.key == 'u' || event.key == 'i') {
        turnDown = false;
    }

    if (event.key == ' ') {
        endSpacePos = mousePos;
        if (Math.abs(endSpacePos.x - startSpacePos.x) + Math.abs(endSpacePos.y - startSpacePos.y) < 0.01) return;

        var box = new b2PolygonShape();
        box.SetAsBoxXYCenterAngle(Math.abs(endSpacePos.x - startSpacePos.x) / 2, Math.abs(endSpacePos.y - startSpacePos.y) / 2, new b2Vec2((endSpacePos.x + startSpacePos.x) / 2, (endSpacePos.y + startSpacePos.y) / 2), 0);
        var particleGroupDef = new b2ParticleGroupDef();
        particleGroupDef.shape = box;
        particleGroupDef.color = new b2ParticleColor(0, 0, 255);
        particleGroupDef.shapeCount = 1;
        particleGroupDef.strength = currentStrength;
        particleGroupDef.flags = flags[currentFlag];
        particleSystem.CreateParticleGroup(particleGroupDef);
        startSpacePos = null;
        endSpacePos = null;
    }
    
    if (event.key == 'u') {
        g_groundBody.setTransform(new b2Vec2(0, 0), g_groundBody.getAngle() - 1);
    }

    if (event.key == 'i') {
        g_groundBody.setTransform(new b2Vec2(0, 0), g_groundBody.getAngle() + 1);
    }
}

document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);

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
bd.type = b2_kinematicBody;
var ground = world.CreateBody(bd);
bd.type = b2_kinematicBody;
bd.position.Set(0, 0);
bd.fixedRotation = false;
var groundMainBody = world.CreateBody(bd);
g_groundBody = groundMainBody;
g_groundBody = ground;

var b1 = new b2PolygonShape();
b1.SetAsBoxXYCenterAngle(0.05, wallSize, new b2Vec2(wallSize * 2, 0), 0);
groundMainBody.CreateFixtureFromShape(b1, 5);

var b2 = new b2PolygonShape();
b2.SetAsBoxXYCenterAngle(0.05, wallSize, new b2Vec2(-wallSize * 2, 0), 0);
groundMainBody.CreateFixtureFromShape(b2, 5);

var b3 = new b2PolygonShape();
b3.SetAsBoxXYCenterAngle(wallSize * 2, 0.05, new b2Vec2(0, wallSize), 0);
groundMainBody.CreateFixtureFromShape(b3, 5);

var b4 = new b2PolygonShape();
b4.SetAsBoxXYCenterAngle(wallSize * 2, 0.05, new b2Vec2(0, -wallSize), 0);
groundMainBody.CreateFixtureFromShape(b4, 5);

// Start particle system
var psd = new b2ParticleSystemDef();
psd.radius = 0.025;
psd.dampingStrength = 0;
var particleSystem = world.CreateParticleSystem(psd);

var testingBodyDef = new b2BodyDef();
testingBodyDef.type = b2_dynamicBody;
testingBodyDef.position.Set(3, 0);
/*var tb = world.CreateBody(testingBodyDef);
var tbFixture = new b2CircleShape;
tbFixture.position.Set(0, 0);
tbFixture.radius = 0.4;
tb.CreateFixtureFromShape(tbFixture, 1);
*/

world.SetGravity(new b2Vec2(0, -9.82));

render();

var gameLoop = setInterval(function () {
    if (holdingParticle) {
        particleSystem.GetPositionBuffer()[particleHolding * 2] = mousePos.x;
        particleSystem.GetPositionBuffer()[particleHolding * 2 + 1] = mousePos.y;
        particleSystem.GetVelocityBuffer()[particleHolding * 2] = (mousePos.x - oldMousePos.x) * 1000;
        particleSystem.GetVelocityBuffer()[particleHolding * 2 + 1] = (mousePos.y - oldMousePos.y) * 1000;
    }

    if (turnDown) {
        if (turnKey == 0) {
            g_groundBody.SetTransform(new b2Vec2(0, 0), g_groundBody.GetAngle() - 0.1 * (Math.PI / 180));
        } else {
            g_groundBody.SetTransform(new b2Vec2(0, 0), g_groundBody.GetAngle() + 0.1 * (Math.PI / 180));
        }
    }

    oldMousePos = mousePos;
}, 1)
