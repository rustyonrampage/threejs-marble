// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require("three");
// Include any additional ThreeJS examples below
require("three/examples/js/controls/OrbitControls");
require("three/examples/js/geometries/ParametricGeometry.js");

const canvasSketch = require("canvas-sketch");

const settings = {
  // Make the loop animated
  duration: 5,
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: "webgl",
};

const sketch = ({ context }) => {
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: context.canvas,
  });

  // WebGL background color
  renderer.setClearColor("#000", 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);
  camera.position.set(0, 0, 4);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera, context.canvas);

  // Setup your scene
  const scene = new THREE.Scene();

  // Setup a geometry
  function calculateHelicoid(u, v, target) {
    let alpha = Math.PI * 2 * (u - 0.5);
    let theta = Math.PI * 2 * (v - 0.5);
    let t = 5;
    let bottom = 1 + Math.cosh(alpha) * Math.cosh(theta);

    let x = (Math.sinh(alpha) * Math.cos(t * theta)) / bottom;
    let z = (Math.sinh(alpha) * Math.sin(t * theta)) / bottom;
    let y = (1.5 * Math.cosh(alpha) * Math.sinh(theta)) / bottom;
    target.set(x, y, z);
  }
  const geometry = new THREE.ParametricGeometry(calculateHelicoid, 100, 100);

  // Setup a material
  // const material = new THREE.MeshBasicMaterial({
  //   color: "red",
  //   wireframe: true
  // });

  function getMaterial() {
    let material = new THREE.MeshPhysicalMaterial({
      color: 0xffffcc,
      roughness: 0,
      metalness: 0.5,
      clearcoat: 1,
      clearcoatRoughness: 0.4,
      side: THREE.DoubleSide,
      // wireframe: true,
    });

    material.onBeforeCompile = function (shader) {
      shader.uniforms.playhead = { value: 0 };

      shader.fragmentShader =
        `uniform float playhead; \n` + shader.fragmentShader;

      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <logdepthbuf_fragment>",
        `
        float diff = dot(vec3(1), vNormal);
        vec3 a = vec3(0.5, 0.5, 0.5);
        vec3 b = vec3(0.5, 0.5, 0.5);
        vec3 c = vec3(1.0, 1.0, 1.0	);
        vec3 d = vec3(0.00, 0.10, 0.20);

        vec3 cc = a + b * cos( 2. * 3.151592 * (c * diff +d +playhead*0. ) );
        
        
        diffuseColor.rgb = cc;
         

       ` + "#include <logdepthbuf_fragment>"
      );

      material.userData.shader = shader;
    };

    return material;
  }

  let material = getMaterial();

  // Balls stuff
  let ballGeometry = new THREE.IcosahedronBufferGeometry(0.26, 5)
  let ball_1 = new THREE.Mesh(ballGeometry, getMaterial())
  let ball_2 = new THREE.Mesh(ballGeometry, getMaterial())

  scene.add(ball_1)
  scene.add(ball_2)

  // Setup a mesh with geometry + material
  const mesh = new THREE.Mesh(geometry, material);





  mesh.castShadow = mesh.receiveShadow = true;
  ball_1.castShadow = mesh.receiveShadow = true;
  ball_2.castShadow = mesh.receiveShadow = true;
  scene.add(mesh);

  scene.add(new THREE.AmbientLight(0xffffff, 1));

  let light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.x = 1;
  light.position.y = 0;
  light.position.z = 1;
  light.castShadow = true;
  light.shadow.mapSize.width = 2048;
  light.shadow.mapSize.height = 2048;
  light.shadow.camera.right = 2;
  light.shadow.camera.left = -2;
  light.shadow.camera.top = 2;
  light.shadow.camera.bottom = -2;
  light.shadow.bias = 0.00001;

  scene.add(light);

  // draw each frame
  return {
    // Handle resize events here
    resize({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight, false);
      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
    },
    // Update & render your scene here
    render({ time, playhead }) {
      if (material.userData.shader)
        material.userData.shader.uniforms.playhead.value = playhead;

      if(ball_1 && ball_2){
        let theta_1 = playhead * 2 * Math.PI
        let theta_2 = playhead * 2 * Math.PI + Math.PI

        ball_1.position.x = 0.5 * Math.sin(theta_1)
        ball_1.position.z = 0.5 * Math.cos(theta_1)

        ball_2.position.x = 0.5 * Math.sin(theta_2)
        ball_2.position.z = 0.5 * Math.cos(theta_2)
        // ball_1.position.y = 0.5 

      }
      console.log("playhead ");
      mesh.rotation.y = playhead * Math.PI * 2;
      controls.update();
      renderer.render(scene, camera);
    },
    // Dispose of events & renderer for cleaner hot-reloading
    unload() {
      controls.dispose();
      renderer.dispose();
    },
  };
};

canvasSketch(sketch, settings);
