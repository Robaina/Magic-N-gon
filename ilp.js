// Build MILP
let n; // n > 3
let number_of_vertices;
let number_triplets;
let number_seq;
let triple_sum;
let initial_vertex;
let initial_label;
let solution;
let cy;


function initializeGraph(n=6, solution=null,
  initial_vertex=null, initial_label=null) {
  number_of_vertices = 3 * n + 1;
  number_triplets = createNumberTriplets(n);
  number_seq = range(0, number_of_vertices);
  triple_sum = number_of_vertices + 3;

  let graphContainer = document.getElementById("cy");
  let graphStyle = [
    {
      selector: 'node',
      style: {
          'label': 'data(label)',
          'width': '40px',
          'height': '40px',
          'color': 'white',
          'background-color': 'black',
          'font-size': 14,
          'text-halign': 'center',
          'text-valign': 'center'
      }
    },

    {
      selector: 'edge',
      style: {
          'width': '4px',
          'line-color': 'grey',
          'target-arrow-color': 'grey',
          // 'target-arrow-shape': 'triangle',
          // 'control-point-step-size': '20px',
      }
    }
  ];
  let graphData = createGraphJSON(number_of_vertices, number_triplets, solution, initial_vertex, initial_label);

  cy = cytoscape({
    container: graphContainer,
    elements: graphData,
    style: graphStyle,
    userZoomingEnabled: false,
    autoungrabify: true,
    userPanningEnabled: false
  });

  //cy.$(`#n${initial_vertex}`).data().label = initial_label;
  cy.layout({name: "circle"}).run();

  let graphContainerWidth = parseFloat(
    getComputedStyle(graphContainer).width.replace("px", ""));
  let graphContainerHeight = parseFloat(
    getComputedStyle(graphContainer).height.replace("px", ""));

  positionNgonVertices(cy, n,
    0.9 * graphContainerWidth, 0.9 * graphContainerHeight, x_offset=20, y_offset=20);
  positionNgonMiddlePoints(cy, n);
  positionNgonInnerMiddlePoints(cy, n);

}

function solveGame() {
  solution = solveMILP();
  initializeGraph(n, solution, initial_vertex, initial_label);
}

function set4Gon() {
  n = 4;
  initial_vertex = 3 * n + 1;
  initial_label = 3;
  initializeGraph(n, null, initial_vertex, initial_label);
}
function set5Gon() {
  n = 5;
  initial_vertex = 3 * n + 1;
  initial_label = 4;
  initializeGraph(n, null, initial_vertex, initial_label);
}
function set6Gon() {
  n = 6;
  initial_vertex = 3 * n + 1;
  initial_label = 2;
  initializeGraph(n, null, initial_vertex, initial_label);
}


/* Now we can position nodes with relative units (0 - 1) with respect to
graph container */
function positionNgonVertices(cy, number_of_vertices, graphWidth, graphHeight, x_offset=0, y_offset=0) {
  const PI = Math.PI;
  const n = number_of_vertices;
  let angle = 0
  for (let i = 1; i <= 2 * n - 1; i += 2) {

    angle += (2 * PI) / number_of_vertices;
    let x = Math.cos(angle);
    let y = Math.sin(angle);
    // Transform to cytoscape (canvas) coordinates:
    let xp = (1 + x) / 2;
    let yp = (1 + y) / 2;
    // Position vertices
    cy.$(`#n${i}`).renderedPosition({
      x: xp * graphWidth + x_offset,
      y: yp * graphHeight + y_offset
    });
  }

  // position center node
  cy.$(`#n${3 * n + 1}`).renderedPosition({
    x: 0.5 * graphWidth + x_offset,
    y: 0.5 * graphHeight + y_offset
  });
}

function positionNgonMiddlePoints(cy, number_of_vertices) {
  const PI = Math.PI;
  const n = number_of_vertices;
  let angle = 0;
  let pre_vertex_x, pre_vertex_y, post_vertex_x, post_vertex_y;
  for (let i = 2; i <= 2 * n; i += 2) {
    // compute middle point between Ngon vertices
    if (i < 2 * n) {
      pre_vertex_x = cy.$(`#n${i - 1}`).renderedPosition().x;
      pre_vertex_y = cy.$(`#n${i - 1}`).renderedPosition().y;
      post_vertex_x = cy.$(`#n${i + 1}`).renderedPosition().x;
      post_vertex_y = cy.$(`#n${i + 1}`).renderedPosition().y;
    } else {
      pre_vertex_x = cy.$(`#n${i - 1}`).renderedPosition().x;
      pre_vertex_y = cy.$(`#n${i - 1}`).renderedPosition().y;
      post_vertex_x = cy.$("#n1").renderedPosition().x;
      post_vertex_y = cy.$("#n1").renderedPosition().y;
    }

    let x = (pre_vertex_x + post_vertex_x) / 2;
    let y = (pre_vertex_y + post_vertex_y) / 2;

    // Position vertices
    cy.$(`#n${i}`).renderedPosition({
      x: x,
      y: y
    });
  }

}

function positionNgonInnerMiddlePoints(cy, number_of_vertices) {
  const PI = Math.PI;
  const n = number_of_vertices;
  let angle = 0;
  let current_vertex = 1;

  let center_vertex_x = cy.$(`#n${3 * n + 1}`).renderedPosition().x;
  let center_vertex_y = cy.$(`#n${3 * n + 1}`).renderedPosition().y;

  for (let i = 2 * n + 1; i <= 3 * n; i++) {
    let current_vertex_x = cy.$(`#n${current_vertex}`).renderedPosition().x;
    let current_vertex_y = cy.$(`#n${current_vertex}`).renderedPosition().y;

    let x = (current_vertex_x + center_vertex_x) / 2;
    let y = (current_vertex_y + center_vertex_y) / 2;

    // Position vertices
    cy.$(`#n${i}`).renderedPosition({
      x: x,
      y: y
    });

    current_vertex += 2;

  }
}


/* Variable names: x_i_k where
    k is a number from 0 to number_of_vertices indicanting the number chosen
    for each vertex,
    i is the vertex number.
*/

function addNumberSelectionConstraints() {
  /*
  Selects only one number from 0 to number_of_vertices
  for each vertex
  */
  c_str = "";
  for (let i=0; i<number_of_vertices; i++) {
    for (let k=0; k<number_of_vertices; k++) {
      c_str += `+x_${i}_${k} `;
    }
    c_str += "= 1\n";
  }
  return c_str
}

function addUniquenessConstraints() {
  /*
  Ensure unique numbers are assigned to each vertex (non repeated)
  */
  c_str = "";
  for (let k=0; k<number_of_vertices; k++) {
    for (let i=0; i<number_of_vertices; i++) {
      c_str += `+x_${i}_${k} `;
    }
    c_str += "= 1\n";
  }
  return c_str
}

function addTripletSumConstraints() {
  /*
  Ensures that the sum of each triple must be triple_sum
  */
  c_str = "";
  for (let triple of number_triplets) {
    for (let i of triple) {
      for (let k=0; k<number_of_vertices; k++) {
        c_str += `+${k + 1}x_${i}_${k} `;
      }
    }
    c_str += `= ${triple_sum}\n`;
  }
  return c_str
}

function addInitialCondition(vertex, label) {
  /*
  Selects an initial number for a desired vertex
  */
  let c_str = `x_${vertex - 1}_${label - 1} = 1\n`;
  return c_str
}

function writeConstraints(initial_vertex=null, initial_label=null) {
    /* Put all constraints together */
    let constraints_str = "\nSubject To\n";
    constraints_str += addNumberSelectionConstraints()
     + addUniquenessConstraints() + addTripletSumConstraints();
    if (initial_vertex !== null & initial_label !== null) {
      constraints_str += addInitialCondition(initial_vertex, initial_label);
    }
    return constraints_str
}

function writeBinaryVariables() {
  let b_str = "\nGeneral\n";
  for (let i=0; i<number_of_vertices; i++) {
    for (let k=0; k<number_of_vertices; k++) {
      b_str += `x_${i}_${k} `
    }
  }
  return b_str
}

function solveMILP() {

  // Prepare model string
  let model_str = "Minimize\n0x_0_0\n"
   + writeConstraints(initial_vertex, initial_label)
   + writeBinaryVariables()
   + "\nEnd";

  // Call GLPK
  let solution = {};
  let processed_solution = {};
  let lp = glp_create_prob();
  glp_read_lp_from_string(lp, null, model_str);

  glp_scale_prob(lp, GLP_SF_AUTO);

  let smcp = new SMCP({presolve: GLP_ON});
  glp_simplex(lp, smcp);

  let iocp = new IOCP({presolve: GLP_ON});
  glp_intopt(lp, iocp);

  for (let i=1; i<=glp_get_num_cols(lp); i++){
    value = Math.round(glp_mip_col_val(lp, i));
    if (value === 1) {
      let var_name = glp_get_col_name(lp, i);
      solution[var_name] = value;

      // Retrieve numbers for each vertex
      let vertex_name = var_name.split("_")[1];
      let vertex_label = parseInt(var_name.split("_")[2]) + 1;
      processed_solution[vertex_name] = vertex_label;
    }
  }

  if (Object.keys(solution).length > 0) {
    return processed_solution
  } else {
    alert("invalid input!")
  }

}


// Helper functions
function createNumberTriplets(n) {
  let triplets = [];
  let index_sequence = range(0, 2*n - 3, 2);
  for (let i of range(0, n - 1)) {
    triplets.push(range(index_sequence[i], index_sequence[i] + 3));
    triplets.push([index_sequence[i], 2*n + i, number_of_vertices - 1]);
  }
  triplets.push([2*n - 2, 2*n - 1, 0]);
  triplets.push([2*n - 2, number_of_vertices - 2, number_of_vertices - 1]);
  return triplets
}

function range(start, end, step=1) {
  /* Returns a range of numbers,
     from start till end - 1.*/
  let array = [];
  for (i=start; i<end; i+=step) {
    array.push(i);
  }
  return array;
}

function createGraphJSON(number_of_vertices, triplets, solution=null,
  initial_vertex=null, initial_label=null) {
  /* Creates graph data structure */
  let data = [];
  // add nodes
  for (let i=0 ; i<number_of_vertices; i++) {

    let label;
    let id = `n${i + 1}`;
    if (solution !== null) {
      label = solution[i];
    } else if (initial_vertex !== null && initial_vertex === i + 1) {
        label = initial_label;
    } else {
      // label = id;
      label = "";
    }

    let new_node = {"data": {"id": id,
                             "label": label,
                             "position": {x: 100, y: 200}
                           }
                           };
    data.push(new_node);
  }
  // add edges
  for (triplet of triplets) {
    let node_1 = `n${triplet[0] + 1}`;
    let node_2 = `n${triplet[1] + 1}`;
    let node_3 = `n${triplet[2] + 1}`;
    let edge_1 = {"data": {
                  "id": `e_${node_1}_${node_2}`,
                  "source": node_1,
                  "target": node_2}
                };
    let edge_2 = {"data": {
                  "id": `e_${node_2}_${node_3}`,
                  "source": node_2,
                  "target": node_3}
                };

    data.push(edge_1);
    data.push(edge_2);
  }
  return data
}
