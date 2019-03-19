/**
 * 处理数据
 */
import ProjectModel from "../common/model/ProjectModel";
import Utils from "../common/Utils";

export function handleData(actionType, dispatch, storeName, data, pageSize, favoriteDao) {
    let fixItems = [];
    if (data && data.data) {
        if (Array.isArray(data.data)) {
            fixItems = data.data;
        } else if (Array.isArray(data.data.items)) {
            fixItems = data.data.items;
        }
    }
    //第一次要加载的数据
    let showItems = pageSize > fixItems.length ? fixItems : fixItems.slice(0, pageSize);
    //包装成带收藏Item的_projectModels
    _projectModels(showItems, favoriteDao, projectModels => {
        dispatch({
            type: actionType,
            items: fixItems,
            projectModels: projectModels,
            storeName,
            pageIndex: 1,
        })
    });

}

/**
 * 通过本地的收藏状态包装Item
 * @param showItems
 * @param favoriteDao
 * @param callback
 * @returns {Promise<void>}
 * @private
 */
export async function _projectModels(showItems, favoriteDao, callback) {
    let keys = [];
    try {
        keys = await favoriteDao.getFavoriteKeys();//async ··await 异步转同步
    } catch (e) {
        console.log(e)
    }
    let projectModels = [];
    for (let i = 0, len = showItems.length; i < len; i++) {
        projectModels.push(new ProjectModel(showItems[i], Utils.checkFavorite(showItems[i], keys)));
    }
    doCallBack(callback, projectModels);

}

export const doCallBack = (callBack, object) => {
    if (typeof callBack === 'function') {
        callBack(object);
    }
};