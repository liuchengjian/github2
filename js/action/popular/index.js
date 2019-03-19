import Types from '../types';
import DataStore, {FLAG_STORAGE} from '../../expand/dao/DataStore';
import {_projectModels, handleData} from '../ActionUtil';
export function onRefreshPopular(storeName, url, pageSize,favoriteDao) {
    return dispatch=>{
        dispatch({type:Types.POPULAR_REFRESH,storeName:storeName})
        let datStore = new DataStore();
        datStore.fetchData(url,FLAG_STORAGE.flag_popular)
            .then(data=>{
                handleData(Types.POPULAR_REFRESH_SUCCESS,dispatch,storeName,data,pageSize,favoriteDao)
            })
            .catch(error=>{
                console.log(error);
                dispatch({
                    type: Types.POPULAR_REFRESH_FAIL,
                    storeName,//es新语法
                    error
                });
            })
    }
}

/**
* 加载更多
* @param storeName
* @param pageIndex 第几页
* @param pageSize 每页展示条数
* @param dataArray 原始数据
* @param callBack 回调函数，可以通过回调函数来向调用页面通信：比如异常信息的展示，没有更多等待
* @param favoriteDao
* @returns {function(*)}
*/
export function onLoadMorePopular(storeName, pageIndex, pageSize, dataArray = [],favoriteDao, callBack) {
    return dispatch => {
        setTimeout(() => {//模拟网络请求
            if ((pageIndex - 1) * pageSize >= dataArray.length) {//已加载完全部数据
                if (typeof callBack === 'function') {
                    callBack('no more')
                }
                dispatch({
                    type: Types.POPULAR_LOAD_MORE_FAIL,
                    error: 'no more',
                    storeName: storeName,
                    pageIndex: --pageIndex,
                    projectModels: dataArray,
                })
            }else {
                //本次和载入的最大数量
                let max = pageSize * pageIndex > dataArray.length ? dataArray.length : pageSize * pageIndex;
                _projectModels(dataArray.splice(0,max),favoriteDao,projectModels=>{
                    dispatch({
                        type: Types.POPULAR_LOAD_MORE_SUCCESS,
                        storeName,
                        pageIndex,
                        projectModels: projectModels,
                    })
                });

            }
        })
    }
}
/**
 * 刷新收藏状态
 * @param storeName
 * @param pageIndex 第几页
 * @param pageSize 每页展示条数
 * @param dataArray 原始数据
 * @param favoriteDao
 * @returns {function(*)}
 */
export function onFlushPopularFavorite(storeName, pageIndex, pageSize, dataArray = [], favoriteDao) {
    return dispatch=>{
        //本次和载入的最大数量
        let max = pageSize * pageIndex > dataArray.length ? dataArray.length : pageSize * pageIndex;
        _projectModels(dataArray.slice(0, max),favoriteDao,data=>{
            dispatch({
                type: Types.FLUSH_POPULAR_FAVORITE,
                storeName,
                pageIndex,
                projectModels: data,
            })
        })
    }
}

