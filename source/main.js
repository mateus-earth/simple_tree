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
//  Copyright : stdmatt 2019 - 2022                                            //
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

//----------------------------------------------------------------------------//
// Classes                                                                    //
//----------------------------------------------------------------------------//
//------------------------------------------------------------------------------
class Branch
{
    //--------------------------------------------------------------------------
    constructor(
        start_x, start_y,
        size, angle, generation,
        parent_tree)
    {
        this.parent_tree = parent_tree;

        this.curr_angle      = angle;
        this.curr_size       = size;
        this.curr_generation = generation;

        const end_x = this.curr_size * Math.cos(to_radians(this.curr_angle));
        const end_y = this.curr_size * Math.sin(to_radians(this.curr_angle));
        this.start_pos = make_vec2(start_x, start_y);
        this.end_pos   = make_vec2(end_x, end_y);

        this.time_to_grow = random_float(ANIM_GROW_DURATION_MIN, ANIM_GROW_DURATION_MAX);
        this.grow_time    = 0;

        this.max_branches_count = random_int(BRANCHES_COUNT_MIN, BRANCHES_COUNT_MAX)
        this.branches = [];
    }
}

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
function create_tree()
{
    const t = {};
    reset_tree(t);
    return t;
}

//------------------------------------------------------------------------------
function reset_tree(tree)
{

    const canvas_w = get_canvas_width ();
    const canvas_h = get_canvas_height();

    const root_x = 0; random_int(-canvas_w * 0.5, +canvas_w * 0.5);
    const root_y = (canvas_h * 0.5);
    const size   = random_int(SIZE_MIN,  SIZE_MAX);
    const angle  = -90 + random_int(-10, +10);

    tree.branch = new Branch(root_x, root_y, size, angle, 0, tree);
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
    set_main_canvas       (user_canvas);
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
function init_constants_and_globals()
{
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

    G.trees             = null;

    G.season_index      = 0;
    G.season_max_time   = C.SEASON_TIME.random_float();
    G.season_curr_time  = 0;
    G.season_t          = 0;
}

//------------------------------------------------------------------------------
function update(dt)
{
    begin_draw();
        //
        // Update season
        //
        {
            G.season_curr_time += dt;
            if(G.season_curr_time >= G.season_max_time) {
                G.season_curr_time = 0;
                G.season_max_time  = C.SEASON_TIME.random_float();
                G.season_index     = wrap_around(G.season_index + 1, C.SEASON_COLORS.length);
            }

            const next_index = wrap_around(G.season_index + 1, C.SEASON_COLORS.length);
            G.season_t     = (G.season_curr_time / G.season_max_time);
            G.season_color = chroma.mix(
                C.SEASON_COLORS[G.season_index],
                C.SEASON_COLORS[next_index],
                G.season_t
            )
        }

        clear_canvas(G.season_color);
    end_draw();
}
