import {
  query as queryUsers,
  queryCurrent,
  login,
  getDetail,
  logout,
  register,
  gitlabRegister,
  createGitlabProject,
  changePass,
  getTeamByName,
} from "../services/user";
import { setAuthority } from "../utils/authority";
import cookie from "../utils/cookie";
import { routerRedux } from "dva/router";

export default {
  namespace: "user",

  state: {
    list: [],
    currentUser: null,
    notifyCount: 0,
    register: null,
  },

  effects: {
    * getTeamByName({ payload, callback, fail }, { call, put, select }) {
      const response = yield call(getTeamByName, payload);
      if (response) {
        yield put({ type: "saveOtherTeam", team: response.bean });
        setTimeout(() => {
          callback && callback(response.bean);
        });
      } else {
        fail && fail();
      }
    },
    * changePass({ payload, callback }, { call, put, select }) {
      const response = yield call(changePass, payload);
      if (response) {
        yield put({ type: "tologout" });
        yield put(routerRedux.push("/user/login"));
        callback && callback();
      }
    },
    * login({ payload }, { call, put, select }) {
      const response = yield call(login, payload);
      //
      // cookie.set("token", "f8ocCLBCjzn4qHJU4oOzGwbLgzkdMI");
      // window.location.reload();
      //
      if (response) {
        yield put({ type: "changeLoginStatus", payload: response });

        // 非常粗暴的跳转,登陆成功之后权限会变成user或admin,会自动重定向到主页 Login success after permission
        // changes to admin or user The refresh will automatically redirect to the home
        // page yield put(routerRedux.push('/')); cookie.set('token',
        // response.bean.token); const urlParams = new URL(window.location.href); const
        // pathname = yield select(state => state.routing.location.pathname); // add the
        // parameters in the url const redirect = urlParams.searchParams.get('redirect',
        // pathname); yield put(routerRedux.push('/index'));
        cookie.set("token", response.bean.token);
        window.location.reload();
      }
    },
    * logout(_, { put, select }) {
      try {
        // get location pathname
        const urlParams = new URL(window.location.href);
        const pathname = yield select(state => state.routing.location.pathname);
        // add the parameters in the url
        urlParams.searchParams.set("redirect", pathname);
        window.history.replaceState(null, "login", urlParams.href);
      } finally {
        // yield put(routerRedux.push('/user/login')); Login out after permission
        // changes to admin or user The refresh will automatically redirect to the login
        // page
        yield put({ type: "tologout" });

        yield put({ type: "saveCurrentUser", payload: null });

        window.location.reload();
      }
    },
    * register({ payload, complete }, { call, put, select }) {
      const response = yield call(register, payload);

      if (response) {
        // 非常粗暴的跳转,登陆成功之后权限会变成user或admin,会自动重定向到主页 Login success after permission
        // changes to admin or user The refresh will automatically redirect to the home
        // page yield put(routerRedux.push('/'));
        cookie.set("token", response.bean.token);

        const urlParams = new URL(window.location.href);
        const pathname = yield select(state => state.routing.location.pathname);
        // add the parameters in the url
        const redirect = urlParams.searchParams.get("redirect", pathname);

        yield put({ type: "registerHandle", payload: response.bean, redirect });

        // yield put(routerRedux.push(redirect || '/index')); window.location.reload();
      }

      complete && complete();
    },
    * fetch(_, { call, put }) {
      const response = yield call(queryUsers);
      yield put({ type: "save", payload: response });
    },
    * fetchCurrent({ callback, handleError }, { call, put }) {
      const response = yield call(getDetail, handleError);
      if (response) {
        yield put({ type: "saveCurrentUser", payload: response.bean });
        callback && callback(response.bean);
      }
    },
    * gitlabRegister({ payload, callback }, { call, put }) {
      const response = yield call(gitlabRegister, payload);
      if (response) {
        callback && callback(response.bean);
      }
    },
    * createGitlabProject({ payload, callback }, { call, put }) {
      const response = yield call(createGitlabProject, payload);
      if (response) {
        callback && callback(response.bean);
      }
    },
  },

  reducers: {
    registerHandle(state, { payload, redirect }) {
      return {
        ...state,
        register: payload,
        redirect,
      };
    },
    changeLoginStatus(state, { payload }) {
      setAuthority("user");
      return {
        ...state,
        status: payload.status,
        type: payload.type,
      };
    },
    tologout(state, action) {
      cookie.remove("token");
      cookie.remove("token", { domain: "" });
      cookie.remove("guide");
      cookie.remove("guide", { domain: "" });
      cookie.remove("newbie_guide");
      cookie.remove("platform_url");
    },
    save(state, action) {
      return {
        ...state,
        list: action.payload,
      };
    },
    saveCurrentUser(state, action) {
      return {
        ...state,
        currentUser: action.payload,
      };
    },
    saveOtherTeam(state, action) {
      const currentUser = state.currentUser;
      currentUser.teams.push(action.team);
      return {
        ...state,
        currentUser: Object.assign({}, currentUser),
      };
    },
    changeNotifyCount(state, action) {
      return {
        ...state,
        notifyCount: action.payload,
      };
    },
  },
};
