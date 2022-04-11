//~---------------------------------------------------------------------------//
//                        _      _                 _   _                      //
//                    ___| |_ __| |_ __ ___   __ _| |_| |_                    //
//                   / __| __/ _` | '_ ` _ \ / _` | __| __|                   //
//                   \__ \ || (_| | | | | | | (_| | |_| |_                    //
//                   |___/\__\__,_|_| |_| |_|\__,_|\__|\__|                   //
//                                                                            //
//  File      : main.js                                                       //
//  Project   : simple_tree                                                   //
//  Date      : Aug 25, 2019                                                  //
//  License   : GPLv3                                                         //
//  Author    : stdmatt <stdmatt@pixelwizards.io>                             //
//  Copyright : stdmatt 2019 - 2022                                           //
//                                                                            //
//  Description :                                                             //
//                                                                            //
//---------------------------------------------------------------------------~//

//----------------------------------------------------------------------------//
// Constants                                                                  //
//----------------------------------------------------------------------------//
//------------------------------------------------------------------------------
__SOURCES = [
    "/modules/demolib/modules/external/chroma.js",
    "/modules/demolib/source/demolib.js",
]

//----------------------------------------------------------------------------//
// Constants                                                                  //
//----------------------------------------------------------------------------//
const C = {} // Constants
const G = {} // Globals



//------------------------------------------------------------------------------
function create_sub_branch(branch)
{
    if(branch.curr_generation >= branch.parent_tree.max_generations) {
        return;
    }

    const tx = random_float(0.7, 1.0);
    const ty = random_float(0.7, 1.0);

    const x  = lerp(tx, branch.start_pos.x, branch.end_pos.x);
    const y  = lerp(ty, branch.start_pos.y, branch.end_pos.y);
    const s  = branch.curr_size  * random_float(DECAY_MIN, DECAY_MAX);
    const a  = branch.curr_angle + random_float(ANGLE_MIN, ANGLE_MAX);
    const g  = (branch.curr_generation + 1);
    const p  = branch.parent_tree;

    const b = new Branch(x, y, s, a, g, p);
    branch.branches.push(b);
}

//------------------------------------------------------------------------------
function draw_branch(branch, dt)
{
    const size = 2;
    set_canvas_stroke_size(size);

    branch.grow_time += dt;

    const  t = Math.min(branch.grow_time / branch.time_to_grow, 1.0);
    const x1 = branch.start_pos.x;
    const y1 = branch.start_pos.y;
    const x2 = lerp(t, x1, branch.end_pos.x);
    const y2 = lerp(t, y1, branch.end_pos.y);

    draw_line(x1, y1, x2, y2);

    const change = random_float(0, 1);
    if(change < t && branch.branches.length < branch.max_branches_count) {
        create_sub_branch(branch);
    }

    for(let i = 0; i < branch.branches.length; ++i) {
        draw_branch(branch.branches[i], dt);
    }
}


//------------------------------------------------------------------------------
function draw_tree(tree, dt)
{
    set_canvas_stroke(tree.color);
    draw_branch      (tree.branch, dt);
}


//----------------------------------------------------------------------------//
// Setup / Entry Point                                                        //
//----------------------------------------------------------------------------//
//------------------------------------------------------------------------------
function setup_demo_mode()
{
    return new Promise((resolve, reject)=>{
        demolib_load_all_scripts(__SOURCES).then(()=> {
            canvas = document.createElement("canvas");

            canvas.width            = window.innerWidth;
            canvas.height           = window.innerHeight;
            canvas.style.position   = "fixed";
            canvas.style.left       = "0px";
            canvas.style.top        = "0px";
            canvas.style.zIndex     = "-100";

            document.body.appendChild(canvas);

            resolve();
        });
    });
}

//------------------------------------------------------------------------------
function setup_common(user_canvas)
{
    set_main_canvas(user_canvas);
    install_input_handlers(user_canvas);

    set_random_seed(null);

    init_constants_and_globals();

    translate_canvas_to_center();
    start_draw_loop(update);
}

//------------------------------------------------------------------------------
function demo_start(user_canvas)
{
    if(!user_canvas) {
        setup_demo_mode().then((new_canvas)=>{
            setup_common(new_canvas);
        });
    } else {
        setup_common(user_canvas);
    }
}


//----------------------------------------------------------------------------//
// Demo                                                                       //
//----------------------------------------------------------------------------//
//------------------------------------------------------------------------------
function init_constants_and_globals()
{
    //
    // Constants
    //

    // Tree
    C.MAX_TREES    = 5;
    C.TREE_AGE     = make_min_max(2, 10);    // seconds
    C.TREE_SIZE    = make_min_max(0.1, 0.7); // % of screen
    C.SPREAD_ANGLE = make_min_max(-15, +15); // degrees

    // Season
    C.SEASON_TIME  = make_min_max(1, 1); // seconds;
    C.SPRING_COLOR = chroma("cyan");
    C.SUMMER_COLOR = chroma("blue");
    C.AUTUMN_COLOR = chroma("gray");
    C.WINTER_COLOR = chroma("white");
    C.SEASON_COLORS = [ C.SPRING_COLOR, C.SUMMER_COLOR, C.AUTUMN_COLOR, C.WINTER_COLOR ];
    G.SPRING_INDEX = 0;

    //
    // Globals
    //

    // Season
    G.season_index      = 0;
    G.season_max_time   = C.SEASON_TIME.random_float();
    G.season_curr_time  = 0;
    G.season_t          = 0;
    G.sun_pos           = null;

    // Tree
    G.trees = [];

    const start_tree = new Branch(
        null,
        0, get_canvas_height(0.5),
        10, 0
    );
    G.trees.push(start_tree);
}

//------------------------------------------------------------------------------
function update(dt)
{
    begin_draw();

    //
    // Update season
    //
    G.season_curr_time += dt;

    const season_has_changed = G.season_curr_time >= G.season_max_time;
    const next_index         = wrap_around(G.season_index + 1, C.SEASON_COLORS.length);

    if(season_has_changed) {
        G.season_curr_time = 0;
        G.season_max_time  = C.SEASON_TIME.random_float();
        G.season_index     = next_index;
    }

    G.season_t     = (G.season_curr_time / G.season_max_time);
    G.season_color = chroma.mix(
        C.SEASON_COLORS[G.season_index],
        C.SEASON_COLORS[next_index],
        G.season_t
    )

    clear_canvas(G.season_color);

    //
    // Update Trees
    //
    G.sun_pos = get_mouse_pos();
    if(!G.sun_pos) {
        G.sun_pos = make_vec2(
            Math.cos(get_total_time()) * get_canvas_width() * 0.5,
            0
        );
    }

    for(let tree_i = 0; tree_i < G.trees.length; ++tree_i) {
        const tree = G.trees[tree_i];
        update_branch(tree, dt);
    }

    end_draw();
}


//
// Branch
//
//------------------------------------------------------------------------------
class Branch
{
    constructor(
        parent_branch,
        start_x, start_y,
        max_thickness,
        generation
    )
    {
        this.parent_branch = parent_branch;

        this.generation = generation;
        this.life_time  = 0;

        this.thickness     = 0;
        this.max_thickness = max_thickness;

        this.start_position = null;
        this.curr_position  = null;

        this.branches = [];

        //
        // Init...
        //
        this.start_position = make_vec2(start_x, start_y);
        this.curr_position = copy_vec2(this.start_position);
    }
}

//------------------------------------------------------------------------------
function update_branch(branch, dt)
{
    branch.life_time += dt;

    let is_growing       = false;
    let is_getting_thick = false;
    let is_branching     = false;

    if(branch.life_time < 2) {
        is_growing = true;
    } else if(branch.life_time < 3) {
        is_branching = true;
    }
    else {
        // is_getting_thick = true;
    }

    const start_pos = branch.start_position;
    let curr_pos    = branch.curr_position;

    //
    // Growing
    //
    if(is_growing) {
        let grow_vec = direction_unit(curr_pos.x, curr_pos.y, G.sun_pos.x, G.sun_pos.y);

        const grow_factor = random_float(0, 5);
        mul_vec2(grow_vec, grow_factor);
        add_vec2(curr_pos, grow_vec);
    }

    //
    // Branching
    //
    if(is_branching) {
        const chance = random_float(0, 1);
        if(chance > 0.9) {
            const x  = lerp(random_float(0.3, 1.0), start_pos.x, curr_pos.x);
            const y  = lerp(random_float(0.3, 1.0), start_pos.y, curr_pos.y);
            const g  = (branch.generation + 1);
            const mt = (branch.max_thickness * (1 / g));

            const new_branch = new Branch(branch, x, y, mt, g)
            branch.branches.push(new_branch);
        }
    }


    //
    // Getting Thick
    //
    if(is_getting_thick) {
        const thick_factor = random_float(0.1, 0.3);
        branch.thickness += thick_factor;
    }

    set_canvas_stroke_size(branch.thickness);
    draw_line(start_pos.x, start_pos.y, curr_pos.x, curr_pos.y);

    for(let i = 0; i < branch.branches.length; ++i) {
        update_branch(branch.branches[i], dt);
    }
}
