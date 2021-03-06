import React, { useContext, useEffect, Fragment, useState, ChangeEvent, useCallback } from 'react';
import { Store, FETCH_EPISODES, EPISODES_URL, ADD_TO_FAVORITES, REMOVE_FROM_FAVORITES, generateEpisodesUrl } from '../../Store';
import { Link } from 'react-router-dom';
import { IEpisode, IAction } from '../../interfaces';
import Pagination from '../elements/Pagination';
import Grid from '../elements/Grid';
import { formatEpisode } from '../../utils';
import Loading from '../elements/Loading';
import Error from '../elements/Error';

const Episodes: React.FC = (): JSX.Element => {
   const { state: { episodeState }, dispatch } = useContext(Store);
   const [loading, setLoading] = useState<boolean>(false);
   const [page, setPage] = useState<number>(1);
   const [search, setSearch] = useState<string>('');
   const [error, setError] = useState<{ message: string | null }>({ message: null });
   const [searchMatches, setSearchMatches] = useState<IEpisode[]>([]);

   useEffect(
      () => {
         fetchEpisodes();
      },
      [page]
   );

   useEffect(
      () => {
         searchEpisodes();
      },
      [search]
   );

   const fetchEpisodes = async (): Promise<void> => {
      try {
         setLoading(true);
         const res = await fetch(generateEpisodesUrl(EPISODES_URL, page));
         const { info, results: episodes } = await res.json();
         dispatch({ type: FETCH_EPISODES, payload: { episodes, info } });
         setLoading(false);
      } catch (error) {
         console.error(error);
         setError({ message: error.message });
      }
   };

   const searchEpisodes = useCallback(
      async () => {
         const query: false | RegExp = search !== '' && new RegExp(search, 'gi');
         const [page1, page2] = await Promise.all(
            [generateEpisodesUrl(EPISODES_URL, 1), generateEpisodesUrl(EPISODES_URL, 2)].map(url => fetch(url).then(res => res.json()))
         );
         const allEpisodes: IEpisode[] = [...page1.results, ...page2.results];
         if (!query || !allEpisodes) return;
         setSearchMatches(allEpisodes.filter(({ name }: IEpisode): boolean => query.test(name)));
      },
      [search]
   );

   const toggleFavorite = (episode: IEpisode): IAction =>
      dispatch({
         type: episodeState.favorites.includes(episode) ? REMOVE_FROM_FAVORITES : ADD_TO_FAVORITES,
         payload: episode
      });

   const renderEpisodes = (episodes: IEpisode[]): JSX.Element[] =>
      episodes.map((episode: IEpisode): JSX.Element => (
         <Fragment key={episode.id}>
            <div className='p-5 bg-indigo-700 rounded mx-auto w-4/5 flex justify-between'>
               <div>
                  <h3>
                     <a href={episode.url} className='no-underline text-gray-100 hover:text-gray-300'>
                        {episode.name}
                     </a>
                  </h3>
                  <p className='text-sm text-gray-300'>Season {formatEpisode(episode.episode)}</p>
               </div>
               <br />
               <div>
                  <Link to={`episode/${episode.id}`}>
                     <button className='bg-orange-400 text-sm mx-2 hover:bg-orange-300 text-grey-100 shadow py-2 px-4 rounded-full'>
                        View details
                     </button>
                  </Link>
                  <button
                     className={episodeState.favorites.includes(episode) ? removeFromFavoritesBtn : addToFavoritesBtn}
                     onClick={() => toggleFavorite(episode)}>
                     {episodeState.favorites.includes(episode) ? 'Remove from' : 'Add to'} favorites
                  </button>
               </div>
            </div>
         </Fragment>
      ));

   return loading || !episodeState ? (
      <Loading />
   ) : (
      <div className='p-3 m-auto bg-indigo-500 text-gray-100 min-h-screen'>
         <div className='flex justify-between'>
            {episodeState && episodeState.info && <Pagination pages={episodeState.info.pages} setPage={setPage} visible={search === ''} />}
            <div className='align-middle'>
               <input
                  type='text'
                  placeholder='Search episodes'
                  className='mt-4 shadow appearance-none border rounded w-full py-1 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
                  value={search}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
               />
            </div>
         </div>
         <Grid minColumnWidth={650} gridGap={20}>
            {episodeState.episodes && search.length ? renderEpisodes(searchMatches) : renderEpisodes(episodeState.episodes)}
         </Grid>
         {error.message && <Error errorMessage={error.message} />}
         {episodeState.info && <Pagination pages={episodeState.info.pages} setPage={setPage} visible={search === ''} />}
      </div>
   );
};

const addToFavoritesBtn: string = 'bg-green-400 mx-2 text-sm hover:bg-green text-gray-100 shadow py-2 px-4 rounded-full';
const removeFromFavoritesBtn: string = 'bg-red-200 mx-2 text-sm hover:bg-red text-gray-100 shadow py-2 px-4 rounded-full';

export default Episodes;
