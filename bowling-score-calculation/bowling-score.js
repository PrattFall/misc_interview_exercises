const add = (a, b) => a + b;
const interpolate = (inter) => (acc, x) => acc + inter + x;

class Frame {
    constructor (id) {
        this.scores = [];
        this.id = id;
    }

    getId () {
        return this.id;
    }

    scoreTotal () {
        return this.scores.reduce(add, 0);
    }

    score (index) {
        return this.scores[index] || 0;
    }

    hasScores () {
        return this.scores.length > 0;
    }

    isSpare () {
        return this.hasScores() && this.scoreTotal() === 10;
    }

    isStrike () {
        return this.hasScores() && this.score(0) === 10;
    }

    validateAddScore (score) {
        if(this.scores.length > 1)
        {
            throw { message: "Frame can only contain 2 scores" };
        }
        else if (score > 10)
        {
            throw { message: "Score must be no greater than 10" };
        }
        else if (this.scoreTotal() + score > 10)
        {
            throw { message: "Frame cannot contain more than 10" };
        }
    }

    addScore (score) {
        this.validateAddScore(score);
        this.scores.push(score);
    }
}

class Game {
    constructor () {
        this.frames = [];
    }

    frame (frameId) {
        if(typeof this.frames[frameId] === "undefined")
        {
            this.frames[frameId] = new Frame(frameId);
        }

        return this.frames[frameId];
    }

    nextFrame (frame) {
        return this.frame(frame.getId() + 1);
    }

    // Potentially overly complicated
    // TODO: Refactor if possible
    handleSpecial (frame, steps) {
        let nextFrame = this.nextFrame(frame);
        let stepsLeft = steps;
        let result = 0;

        if(nextFrame.isStrike())
        {
            result = 10;
            stepsLeft--;

            if(stepsLeft > 0)
            {
                result += this.handleSpecial(nextFrame, stepsLeft);
            }
        }
        else
        {
            result = nextFrame.score(0);
            stepsLeft--;

            if(stepsLeft > 0)
            {
                result += nextFrame.score(1);
            }
        }

        return result;
    }

    special (frame) {
        if(frame.isStrike())
        {
            return this.handleSpecial(frame, 2);
        }
        else if(frame.isSpare())
        {
            return this.handleSpecial(frame, 1);
        }

        return 0;
    }

    scoreTotal () {
        return this.frames
            .map((frame) => frame.scoreTotal() + this.special(frame))
            .reduce(add, 0);
    }
}

// I dub this "not_the_best_testing_framework.js"

const assert = {
    equal : (a, b) => {
        if (a !== b)
        {
            throw { message: `Values are not equal. Expected ${a}; got ${b}.` };
        }
    },
    throwsException : (f) => {
        try {
            f();
            throw { message: "Function did not throw an exception when one was expected." };
        }
        catch (e) { /* nothing */ }
    }
};

class test {
    constructor (name, func) {
        this.name = name;
        this.func = func;
        this.failureMessage = "";
        this.succeeded = true;
    }

    run (defaultState) {
        try {
            this.func(defaultState);
            this.succeeded = true;
        } catch (e) {
            this.failureMessage = e.message;
            this.succeeded = false;
        }
    }

    successSymbol () {
        return this.succeeded ? "+" : "-";
    }

    outputFailureMessage () {
        if(this.failureMessage.length > 0)
        {
            return "\n    (" + this.failureMessage + ")";
        }

        return "";
    }

    output () {
        return this.successSymbol() + " " + this.name +
            this.outputFailureMessage();
    }
}

const runTestWithState = (defaultState) => (test) => {
    try {
        test.run(defaultState());
    }
    catch(e) {
        test.succeeded = false;
        test.failureMessage = e.message;
    }

    return test.output();
};

const runTests = (tests, defaultState) =>
    tests.map(runTestWithState(defaultState));

const logTestOutput = (output) => {
    console.log(output.reduce(interpolate("\n")));
};

// Now let's create the tests

const tests = [
    new test("Should be able to add to score", (state) => {
        state.game.frame(1).addScore(5);

        assert.equal(state.game.scoreTotal(), 5);
    }),
    new test("Should not be able to add score > 10 per bowl", (state) => {
        assert.throwsException(() => {
            state.game.frame(1).addScore(11);
        });
    }),
    new test("Should only allow 2 bowls per frame", (state) => {
        state.game.frame(1).addScore(1);
        state.game.frame(1).addScore(1);

        assert.throwsException(() => {
            state.game.frame(1).addScore(1);
        });
    }),
    new test("Should not be able to add score > 10 per frame", (state) => {
        state.game.frame(1).addScore(10);

        assert.throwsException(() => {
            state.game.frame(1).addScore(1);
        });
    }),
    new test("Should handle strikes appropriately", (state) => {
        state.game.frame(1).addScore(10);
        state.game.frame(2).addScore(5);
        state.game.frame(2).addScore(3);

        assert.equal(state.game.scoreTotal(), 26);
    }),
    new test("Should handle spares appropriately", (state) => {
        state.game.frame(1).addScore(5);
        state.game.frame(1).addScore(5);
        state.game.frame(2).addScore(3);

        assert.equal(state.game.scoreTotal(), 16);
    }),
    new test("Should handle multiple strikes in a row", (state) => {
        state.game.frame(1).addScore(10);
        state.game.frame(2).addScore(10);
        state.game.frame(3).addScore(10);
        state.game.frame(4).addScore(10);

        // Just to follow the game rules
        state.game.frame(5).addScore(0);
        state.game.frame(5).addScore(0);

        assert.equal(state.game.scoreTotal(), 90);
    }),
    new test("Should handle spares and strikes at the same time", (state) => {
        state.game.frame(1).addScore(5);
        state.game.frame(1).addScore(5);
        state.game.frame(2).addScore(10);

        // Just to follow the game rules
        state.game.frame(3).addScore(0);
        state.game.frame(3).addScore(0);

        assert.equal(state.game.scoreTotal(), 30);
    }),
    new test("Should handle strikes and spares at the same time", (state) => {
        state.game.frame(1).addScore(10);
        state.game.frame(2).addScore(5);
        state.game.frame(2).addScore(5);

        // Just to follow the game rules
        state.game.frame(3).addScore(0);
        state.game.frame(3).addScore(0);

        assert.equal(state.game.scoreTotal(), 30);
    })
];

// ...and run them

let output = runTests(tests, () => ({ game: new Game() }));

logTestOutput(output);
