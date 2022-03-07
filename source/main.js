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
const GENERATIONS_MIN = 5;
const GENERATIONS_MAX = 7;
const SIZE_MIN        = 100;
const SIZE_MAX        = 180;
const DECAY_MIN       = 0.7;
const DECAY_MAX       = 0.9;
const ANGLE_MIN       = 10;
const ANGLE_MAX       = 30;

const ANIM_GROW_DURATION_MIN = 1500;
const ANIM_GROW_DURATION_MAX = 3500;

const MIN_TREES_COUNT = 3;
const MAX_TREES_COUNT = 7;

let background_color = null;
let tree_color       = null;
let trees            = null;

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

        this.branches = [];
    }
}

//------------------------------------------------------------------------------
function create_sub_branch(branch)
{
    if(branch.curr_generation >= branch.parent_tree.max_generations) {
        return;
    }

    const new_generation = (branch.curr_generation + 1);
    // Left
    {
        const t = random_float(0.7, 1);

        const x = lerp(branch.start_pos.x, branch.end_pos.x, t);
        const y = letp(branch.start_pos.y, branch.end_pos.y, t);
        const s = branch.curr_size  * random_float(DECAY_MIN, DECAY_MAX);
        const a = branch.curr_angle + random_float(ANGLE_MIN, ANGLE_MAX);
        const g = new_generation;
        const p = branch.parent_tree;

        const branch = new Branch(x, y, s, a, g, p);
        branch.branches.push(branch);
    }

    // Right
    {
        const t = random_float(0.7, 1);

        const x = lerp(branch.start_pos.x, branch.end_pos.x, t);
        const y = letp(branch.start_pos.y, branch.end_pos.y, t);
        const s = branch.curr_size  * random_float(DECAY_MIN, DECAY_MAX);
        const a = branch.curr_angle - random_float(ANGLE_MIN, ANGLE_MAX);
        const g = new_generation;
        const p = branch.parent_tree;

        const branch = new Branch(x, y, s, a, g, p);
        branch.branches.push(branch);
    }
}

//------------------------------------------------------------------------------
function draw_branch(branch)
{
    const size = (branch.parent_tree.max_generations / (branch.curr_generation + 1));
    set_canvas_stroke_size(size);

    const  t = 1.0;
    const x1 = branch.start_posx;
    const y1 = branch.start_posy;
    const x2 = lerp(t, x1, branch.end_pos.x);
    const y2 = lerp(t, y1, branch.end_pos.y);

    draw_line(x1, y1, x2, y2);

    for(let i = 0; i < branch.branches.length; ++i) {
        draw_branch(branch.branches[i]);
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
    tree.max_generations = random_int(GENERATIONS_MIN, GENERATIONS_MAX);
    tree.color           = chroma(tree_color);
    tree.is_done         = false;

    const canvas_w = get_canvas_width ();
    const canvas_h = get_canvas_height();

    const root_x = random_int(-canvas_w * 0.5, +canvas_w * 0.5);
    const root_y = (canvas_h * 0.5);
    const size   = random_int(SIZE_MIN,  SIZE_MAX);
    const angle  = -90 + random_int(-10, +10);

    tree.branch = new Branch(root_x, root_y, size, angle, 0, this);
}

//------------------------------------------------------------------------------
function draw_tree(tree)
{
    set_canvas_stroke(tree.color);
    draw_branch      (tree.branch);
}


//----------------------------------------------------------------------------//
// Setup / Draw                                                               //
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
    set_canvas_fill("white");

    set_random_seed       (null);
    install_input_handlers(user_canvas);

    // Create the Trees.
    background_color = chroma("red");
    tree_color       = chroma("cyan");
    trees            = [];

    const trees_count = random_int(MIN_TREES_COUNT, MAX_TREES_COUNT);
    for(let i = 0; i < trees_count; ++i) {
        trees.push(create_tree());
    }

    translate_canvas_to_center();
    start_draw_loop(draw);
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

//------------------------------------------------------------------------------
function draw(dt)
{
    tween_manager_update(dt);

    begin_draw();
        clear_canvas();
        for(let i = 0; i < trees.length; ++i) {
            const tree = trees[i];
            if(tree.is_done) {
                reset_tree(tree);
            }
            draw_tree(tree);
        }
    end_draw();
}
