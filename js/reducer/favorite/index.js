import Types from '../../action/types';

const defaultState = {};
/**
 *  favorite:{
 *     popular:{
 *         projectModels:[],
 *         isLoading:false
 *     },
 *     trending:{
 *         projectModels:[],
 *         isLoading:false
 *     }
 * }
 * @param state
 * @param action
 * @returns {{}}
 */
export default function onAction(state = defaultState, action) {
    switch (action.type) {
        case Types.FAVORITE_LOAD_DATA://获取数据
            return {
                ...state,
                [action.storeName]: {
                    ...state[action.storeName],
                    isLoading: true,
                }
            };
            break;
        case Types.FAVORITE_LOAD_SUCCESS://下拉刷新获取成功
            return {
                ...state,
                [action.storeName]: {
                    ...state[action.storeName],
                    projectModels: action.projectModels,//此次要展示的数据
                    isLoading: false,
                }

            };
            break;


        case Types.FAVORITE_LOAD_FAIL:
            return {
                ...state,
                [action.storeName]: {
                    ...state[action.storeName],
                    isLoading: false,
                }
            };
            break;
        default:
            return state;

    }
}
