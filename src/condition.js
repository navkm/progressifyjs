/**
 * 
 *
 * @memberof progressify.pwa
 */
class Condition {
    constructor(type, value) {
        this.type = type;
        this.value = value;
    }

}

/**
 * 
 *
 * @memberof progressify.pwa
 */
class ConditionFactory {
    constructor() {
        /** 
         * @member {progressify.pwa.Condition} 
         * @description Returns a Condition that always evaulates to true
         * 
        */
        this.ALWAYS = this.getConditionAlways();

        /** 
         * @member {progressify.pwa.Condition} 
         * @description Returns a Condition that always evaulates to false
         * 
        */
        this.NEVER = this.getConditionNever();

    }

    getConditionAlways() {
        return new Condition('boolean', true);
    }

    getConditionNever() {
        return new Condition('boolean', false);
    }

}
// Evaluate a condition object and return a boolean
function evaluateCondition(condition){
    let result = true;
    if(!condition || !condition.type){
        return result;
    }
    switch(condition.type){
        case 'boolean':
        result = condition.value;
        break;
    }
    return result;
}

export { Condition, ConditionFactory, evaluateCondition };